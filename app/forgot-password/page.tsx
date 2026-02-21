"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        setError("Request fehlgeschlagen");
        return;
      }

      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Passwort zurücksetzen</h1>

        {done ? (
          <div className="mt-4 text-sm text-zinc-700">
            Wenn ein Account existiert, wurde eine E-Mail versendet.
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium">E-Mail</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? "…" : "Link senden"}
            </button>

            <div className="text-sm">
              <a className="text-zinc-700 underline" href="/login">
                Zurück zum Login
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
