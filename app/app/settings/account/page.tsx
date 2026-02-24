'use client';

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useEffect, useMemo, useRef, useState } from "react";

type AccountData = {
  first_name: string | null;
  last_name: string | null;
  username: string;
  email: string | null;
  email_confirmed_at: string | null;
  avatar_url: string | null;
};

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwNew2, setPwNew2] = useState("");
  const [pwChanging, setPwChanging] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const initials = useMemo(() => {
    const a = (firstName || "").trim();
    const b = (lastName || "").trim();
    const f = a ? a[0].toUpperCase() : "";
    const l = b ? b[0].toUpperCase() : "";
    return (f + l) || "?";
  }, [firstName, lastName]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/account", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as { data?: AccountData; error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? "Laden fehlgeschlagen");
        return;
      }
      const d = json?.data;
      if (!d) return;
      setFirstName(d.first_name ?? "");
      setLastName(d.last_name ?? "");
      setUsername(d.username);
      setEmail(d.email);
      setEmailVerified(Boolean(d.email_confirmed_at));
      setAvatarUrl(d.avatar_url ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName || null,
          last_name: lastName || null,
        }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? "Speichern fehlgeschlagen");
        return;
      }
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    setError(null);
    const form = new FormData();
    form.set("kind", "avatar");
    form.set("file", file);

    const res = await fetch("/api/settings/org-docs/upload", { method: "POST", body: form });
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setError(json?.error ?? "Upload fehlgeschlagen");
      return;
    }
    await refresh();
  }

  async function onVerifyEmail() {
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: err } = await supabase.auth.resend({ type: "signup", email: email ?? "", options: { emailRedirectTo: redirectTo } });
      if (err) setError("E-Mail Versand fehlgeschlagen");
    } catch {
      setError("E-Mail Versand fehlgeschlagen");
    }
  }

  async function onChangePassword() {
    setError(null);
    if (!pwNew || pwNew.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen haben");
      return;
    }
    if (pwNew !== pwNew2) {
      setError("Passwörter stimmen nicht überein");
      return;
    }

    setPwChanging(true);
    try {
      const supabase = createSupabaseBrowserClient();
      // Re-authenticate by signing in again
      if (!email) {
        setError("Keine E-Mail vorhanden");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: pwCurrent });
      if (signInError) {
        setError("Aktuelles Passwort ist falsch");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: pwNew });
      if (updateError) {
        setError("Passwort ändern fehlgeschlagen");
        return;
      }

      setPwModalOpen(false);
      setPwCurrent("");
      setPwNew("");
      setPwNew2("");
    } finally {
      setPwChanging(false);
    }
  }

  if (loading) return <div className="p-4">Lädt...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mein Konto</h1>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Speichern..." : "Speichern"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="grid gap-6 md:grid-cols-[1fr_220px] items-center">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Profil</div>
            <div className="mt-1 text-sm text-zinc-600">Bitte gib Deinen vollständigen Namen ein.</div>
          </div>

          <div className="flex items-center justify-end">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-rose-300 flex items-center justify-center text-white text-2xl font-semibold overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center"
                aria-label="Avatar ändern"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 text-zinc-700">
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  />
                  <circle cx="12" cy="13" r="4" strokeWidth="2" />
                </svg>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  void uploadAvatar(f);
                  e.currentTarget.value = "";
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <div>
              <div className="text-xs text-zinc-600 mb-1">Vorname</div>
              <input
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs text-zinc-600 mb-1">Nachname</div>
              <input
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-zinc-600 mb-1">Benutzername</div>
              <input
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
                value={username}
                disabled
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Kontosicherheit</div>
            <div className="mt-1 text-sm text-zinc-600">
              Hier kannst du Deine Login-Daten und Telefonnummer ändern.
            </div>
          </div>

          <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-900">E-Mail-Adresse</div>
                <div className="mt-1 text-sm text-zinc-700">{email ?? "-"}</div>
                <div className={`mt-1 text-xs ${emailVerified ? "text-green-600" : "text-red-600"}`}>
                  {emailVerified ? "Verifiziert" : "Nicht verifiziert"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void onVerifyEmail()}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                disabled={!email || emailVerified}
              >
                E-Mail verifizieren
              </button>
            </div>

            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-900">Mobiltelefonnummer</div>
                <div className="mt-1 text-sm text-zinc-600">
                  Fügen Sie Ihre Telefonnummer hinzu, um Ihr Konto zu sichern.
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              >
                Telefonnummer hinzufügen
              </button>
            </div>

            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-900">Passwort</div>
                <div className="mt-1 text-sm text-zinc-600">••••••••••••••••••••••••</div>
              </div>
              <button
                type="button"
                onClick={() => setPwModalOpen(true)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              >
                Passwort ändern
              </button>
            </div>
          </div>
        </div>
      </div>

      {pwModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-lg">
            <div className="text-lg font-semibold">Passwort ändern</div>
            <div className="mt-1 text-sm text-zinc-600">Gib Dein aktuelles Passwort ein</div>

            <div className="mt-4 space-y-3">
              <div>
                <input
                  type="password"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="Gib Dein aktuelles Passwort ein"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="Gib Dein neues Passwort ein"
                />
                <div className="mt-1 text-xs text-zinc-500">
                  Das Passwort muss mindestens 8 Zeichen, einen Großbuchstaben und eine Zahl
                  enthalten.
                </div>
              </div>
              <div>
                <input
                  type="password"
                  value={pwNew2}
                  onChange={(e) => setPwNew2(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="Wiederhole das neue Passwort"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPwModalOpen(false)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => void onChangePassword()}
                disabled={pwChanging}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {pwChanging ? "..." : "Passwort ändern"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
