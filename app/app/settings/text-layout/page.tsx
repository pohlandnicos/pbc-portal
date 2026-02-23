'use client';

import { useEffect, useMemo, useRef, useState } from "react";

type SettingsRow = {
  logo_enabled: boolean;
  logo_position: "left" | "right";
  logo_size: "small" | "medium" | "large";
  sender_line_enabled: boolean;
  footer_enabled: boolean;
  logo_url?: string | null;
};

export default function TextLayoutSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logoEnabled, setLogoEnabled] = useState(true);
  const [logoPosition, setLogoPosition] = useState<"left" | "right">("right");
  const [logoSize, setLogoSize] = useState<"small" | "medium" | "large">("small");
  const [senderLineEnabled, setSenderLineEnabled] = useState(true);
  const [footerEnabled, setFooterEnabled] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const logoSizeLabel = useMemo(() => {
    if (logoSize === "small") return "klein";
    if (logoSize === "medium") return "mittel";
    return "groß";
  }, [logoSize]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/settings/text-layout", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as
          | { data?: SettingsRow; error?: string }
          | null;

        if (!res.ok) {
          setError(json?.error ?? "Laden fehlgeschlagen");
          return;
        }

        const d = json?.data;
        if (!d) return;

        setLogoEnabled(Boolean(d.logo_enabled));
        setLogoPosition((d.logo_position ?? "right") as "left" | "right");
        setLogoSize((d.logo_size ?? "small") as "small" | "medium" | "large");
        setSenderLineEnabled(Boolean(d.sender_line_enabled));
        setFooterEnabled(Boolean(d.footer_enabled));
        setLogoUrl(d.logo_url ?? null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/text-layout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_enabled: logoEnabled,
          logo_position: logoPosition,
          logo_size: logoSize,
          sender_line_enabled: senderLineEnabled,
          footer_enabled: footerEnabled,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { data?: unknown; error?: string }
        | null;

      if (!res.ok) {
        setError(json?.error ?? "Speichern fehlgeschlagen");
        return;
      }
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file: File) {
    setError(null);
    const form = new FormData();
    form.set("kind", "logo");
    form.set("file", file);

    const res = await fetch("/api/settings/org-docs/upload", {
      method: "POST",
      body: form,
    });

    const json = (await res.json().catch(() => null)) as
      | { data?: { path?: string }; error?: string }
      | null;

    if (!res.ok) {
      setError(json?.error ?? "Upload fehlgeschlagen");
      return;
    }

    // Refresh signed URL
    const refresh = await fetch("/api/settings/text-layout", { cache: "no-store" });
    const refreshJson = (await refresh.json().catch(() => null)) as
      | { data?: SettingsRow; error?: string }
      | null;

    if (refresh.ok) {
      setLogoUrl(refreshJson?.data?.logo_url ?? null);
    }
  }

  if (loading) {
    return <div className="p-4">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Texte & Layout</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Vorschau
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Logo</div>
            <div className="mt-1 text-sm text-zinc-600">
              Lade hier Dein Logo hoch. Es wird auf Deinen Dokumenten angezeigt (Rechnungen,
              Angebote, Arbeitsscheine).
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-700">Logo einblenden</div>
            <button
              type="button"
              onClick={() => setLogoEnabled((s) => !s)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                logoEnabled ? "bg-blue-600" : "bg-zinc-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  logoEnabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="space-y-4">
              <div>
                <div className="text-xs text-zinc-600 mb-1">Position</div>
                <div className="relative">
                  <select
                    value={logoPosition}
                    onChange={(e) => setLogoPosition(e.target.value as "left" | "right")}
                    className="w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-9 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="left">links</option>
                    <option value="right">rechts</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-zinc-600 mb-1">Größe</div>
                <div className="relative">
                  <select
                    value={logoSize}
                    onChange={(e) => setLogoSize(e.target.value as "small" | "medium" | "large")}
                    className="w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-9 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="small">klein</option>
                    <option value="medium">mittel</option>
                    <option value="large">groß</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  Erneut hochladen
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    void uploadLogo(f);
                    e.currentTarget.value = "";
                  }}
                />
              </div>

              <div className="text-xs text-zinc-500">Aktuell: {logoSizeLabel}</div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="h-64 rounded-lg bg-white relative overflow-hidden">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className={`absolute top-6 ${
                    logoPosition === "right" ? "right-6" : "left-6"
                  } ${
                    logoSize === "small"
                      ? "h-10"
                      : logoSize === "medium"
                        ? "h-14"
                        : "h-20"
                  } object-contain`}
                />
              ) : (
                <div className="absolute top-6 right-6 text-xs text-zinc-400">(kein Logo)</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Absenderzeile</div>
            <div className="mt-1 text-sm text-zinc-600">
              Dein Firmenname und deine Adresse erscheinen in der Absenderzeile.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-700">Absenderzeile anzeigen</div>
            <button
              type="button"
              onClick={() => setSenderLineEnabled((s) => !s)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                senderLineEnabled ? "bg-blue-600" : "bg-zinc-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  senderLineEnabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Fußzeile</div>
            <div className="mt-1 text-sm text-zinc-600">
              Die Fußzeile wird am Ende deiner Dokumente angezeigt.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-700">Fußzeile einblenden</div>
            <button
              type="button"
              onClick={() => setFooterEnabled((s) => !s)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                footerEnabled ? "bg-blue-600" : "bg-zinc-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  footerEnabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
