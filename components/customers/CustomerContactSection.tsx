"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

type Contact = {
  id: string;
  phone_landline: string | null;
  phone_mobile: string | null;
  email: string | null;
};

type Props = {
  customerId: string;
  contact: Contact | null;
};

const schema = z
  .object({
    phone_landline: z.string().optional(),
    phone_mobile: z.string().optional(),
    email: z.string().email("Ungültige E-Mail").optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const filled =
      (val.phone_landline ?? "").trim().length > 0 ||
      (val.phone_mobile ?? "").trim().length > 0 ||
      (val.email ?? "").trim().length > 0;

    if (!filled) {
      ctx.addIssue({
        code: "custom",
        message: "Bitte mindestens Festnetz, Mobil oder E-Mail ausfüllen",
        path: ["phone_landline"],
      });
    }
  });

export function CustomerContactSection({ customerId, contact }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    phone_landline: "",
    phone_mobile: "",
    email: "",
  });

  const hint = useMemo(() => {
    const parsed = schema.safeParse(form);
    if (parsed.success) return null;
    return parsed.error.issues[0]?.message ?? null;
  }, [form]);

  function startEdit() {
    if (!contact) return;
    setError(null);
    setEditMode(true);
    setOpen(true);
    setForm({
      phone_landline: contact.phone_landline ?? "",
      phone_mobile: contact.phone_mobile ?? "",
      email: contact.email ?? "",
    });
  }

  function startCreate() {
    setError(null);
    setEditMode(false);
    setOpen((s) => !s);
    if (!open) {
      setForm({ phone_landline: "", phone_mobile: "", email: "" });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Ungültige Eingabe");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/customer-contacts", {
        method: editMode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editMode
            ? {
                id: contact?.id,
                phone_landline: parsed.data.phone_landline?.trim() || null,
                phone_mobile: parsed.data.phone_mobile?.trim() || null,
                email: parsed.data.email?.trim() || null,
              }
            : {
                customer_id: customerId,
                phone_landline: parsed.data.phone_landline?.trim() || undefined,
                phone_mobile: parsed.data.phone_mobile?.trim() || undefined,
                email: parsed.data.email?.trim() || undefined,
              }
        ),
      });

      const json = (await res.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!res.ok) {
        setError(json?.message ?? "Speichern fehlgeschlagen");
        return;
      }

      setOpen(false);
      setEditMode(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">Kontakt</div>
        {contact ? (
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-xs"
            onClick={() => (open && editMode ? (setOpen(false), setEditMode(false)) : startEdit())}
          >
            {open && editMode ? "Abbrechen" : "Bearbeiten"}
          </button>
        ) : (
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-xs"
            onClick={startCreate}
          >
            {open ? "Abbrechen" : "Kontakt hinzufügen"}
          </button>
        )}
      </div>

      {contact && !open ? (
        <div className="mt-3 space-y-3">
          <div className="text-sm">
            <div className="text-zinc-900">Festnetz</div>
            <div className="font-medium">{contact.phone_landline ?? ""}</div>
          </div>
          <div className="text-sm">
            <div className="text-zinc-900">Mobil</div>
            <div className="font-medium">{contact.phone_mobile ?? ""}</div>
          </div>
          <div className="text-sm">
            <div className="text-zinc-900">E-Mail</div>
            <div className="font-medium">{contact.email ?? ""}</div>
          </div>
        </div>
      ) : open ? (
        <form className="mt-3 space-y-3" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="text-sm">
              <div className="text-zinc-900">Festnetz</div>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={form.phone_landline}
                onChange={(e) =>
                  setForm((s) => ({ ...s, phone_landline: e.target.value }))
                }
              />
            </div>
            <div className="text-sm">
              <div className="text-zinc-900">Mobil</div>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={form.phone_mobile}
                onChange={(e) => setForm((s) => ({ ...s, phone_mobile: e.target.value }))}
              />
            </div>
          </div>
          <div className="text-sm">
            <div className="text-zinc-900">E-Mail</div>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            />
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : hint ? (
            <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
              {hint}
            </div>
          ) : null}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-2 text-sm text-zinc-800">Kein Kontakt hinterlegt</div>
      )}
    </div>
  );
}
