"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

type Props = {
  onCreated: () => void;
};

type CustomerOption = {
  id: string;
  type: "private" | "company";
  company_name: string | null;
  salutation: string | null;
  first_name: string | null;
  last_name: string | null;
  billing_city: string;
};

const schema = z
  .object({
    title: z.string().trim().min(1, "Projekttitel ist Pflichtfeld"),
    received_at: z.string().trim().min(1, "Eingangsdatum ist Pflichtfeld"),
    customer_id: z.string().uuid("Kunde ist Pflichtfeld"),
    description: z.string().optional(),

    new_execution_location: z.boolean(),
    execution_street: z.string().optional(),
    execution_house_number: z.string().optional(),
    execution_address_extra: z.string().optional(),
    execution_postal_code: z.string().optional(),
    execution_city: z.string().optional(),

    contact_open: z.boolean(),
    execution_phone_landline: z.string().optional(),
    execution_phone_mobile: z.string().optional(),
    execution_email: z.string().optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.new_execution_location) {
      if (!val.execution_street || val.execution_street.trim().length === 0) {
        ctx.addIssue({ code: "custom", message: "Straße ist Pflichtfeld", path: ["execution_street"] });
      }
      if (!val.execution_house_number || val.execution_house_number.trim().length === 0) {
        ctx.addIssue({ code: "custom", message: "Hausnummer ist Pflichtfeld", path: ["execution_house_number"] });
      }
      if (!val.execution_postal_code || val.execution_postal_code.trim().length === 0) {
        ctx.addIssue({ code: "custom", message: "PLZ ist Pflichtfeld", path: ["execution_postal_code"] });
      }
      if (!val.execution_city || val.execution_city.trim().length === 0) {
        ctx.addIssue({ code: "custom", message: "Ort ist Pflichtfeld", path: ["execution_city"] });
      }
    }

    if (val.execution_email && val.execution_email.trim().length > 0) {
      const res = z.string().email().safeParse(val.execution_email.trim());
      if (!res.success) {
        ctx.addIssue({ code: "custom", message: "Ungültige E-Mail", path: ["execution_email"] });
      }
    }
  });

export function ProjectCreateDialog({ onCreated }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customersLoading, setCustomersLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  const [form, setForm] = useState({
    title: "",
    received_at: "",
    customer_id: "",
    description: "",

    new_execution_location: false,
    execution_street: "",
    execution_house_number: "",
    execution_address_extra: "",
    execution_postal_code: "",
    execution_city: "",

    contact_open: false,
    execution_phone_landline: "",
    execution_phone_mobile: "",
    execution_email: "",
  });

  useEffect(() => {
    if (!open) return;
    setCustomersLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/customers", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as
          | { data?: CustomerOption[]; error?: string }
          | null;
        if (res.ok) setCustomers(json?.data ?? []);
      } finally {
        setCustomersLoading(false);
      }
    })();
  }, [open]);

  const hint = useMemo(() => {
    const parsed = schema.safeParse(form);
    if (parsed.success) return null;
    return parsed.error.issues[0]?.message ?? null;
  }, [form]);

  const customerOptions = useMemo(() => {
    return customers.map((c) => {
      const name =
        c.type === "company"
          ? c.company_name ?? ""
          : `${c.salutation ?? ""} ${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
      return { id: c.id, label: `${name} (${c.billing_city})` };
    });
  }, [customers]);

  function close() {
    setOpen(false);
    setError(null);
    setLoading(false);
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
      const payload = {
        title: parsed.data.title,
        received_at: parsed.data.received_at,
        customer_id: parsed.data.customer_id,
        description: parsed.data.description || undefined,

        new_execution_location: parsed.data.new_execution_location,
        execution_street: parsed.data.execution_street || undefined,
        execution_house_number: parsed.data.execution_house_number || undefined,
        execution_address_extra: parsed.data.execution_address_extra || undefined,
        execution_postal_code: parsed.data.execution_postal_code || undefined,
        execution_city: parsed.data.execution_city || undefined,

        execution_phone_landline: parsed.data.execution_phone_landline || undefined,
        execution_phone_mobile: parsed.data.execution_phone_mobile || undefined,
        execution_email: parsed.data.execution_email || undefined,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => null)) as
        | { data?: { id?: string } | null; error?: string; message?: string }
        | null;

      if (!res.ok) {
        setError(json?.message ?? "Speichern fehlgeschlagen");
        return;
      }

      close();
      router.refresh();
      onCreated();

      const id = json?.data?.id;
      if (id) router.push(`/app/app/projects/${id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end">
        <button
          type="button"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          onClick={() => setOpen(true)}
        >
          Projekt hinzufügen
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-base font-semibold">Projekt hinzufügen</div>
                <div className="text-sm text-zinc-600">Pflichtfelder ausfüllen und speichern.</div>
              </div>
              <button
                type="button"
                className="rounded-md px-3 py-1 text-sm text-zinc-700"
                onClick={close}
              >
                Schließen
              </button>
            </div>

            <form className="space-y-4 px-5 py-4" onSubmit={onSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-sm text-zinc-700">Projekttitel*</label>
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={form.title}
                    onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-700">Eingangsdatum*</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={form.received_at}
                    onChange={(e) => setForm((s) => ({ ...s, received_at: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-700">Kunde*</label>
                  <select
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={form.customer_id}
                    onChange={(e) => setForm((s) => ({ ...s, customer_id: e.target.value }))}
                    disabled={customersLoading}
                  >
                    <option value="">{customersLoading ? "Laden..." : "Bitte wählen"}</option>
                    {customerOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-zinc-700">Beschreibung</label>
                  <textarea
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={form.description}
                    onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="rounded-lg border bg-zinc-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-zinc-800">Ausführungsort</div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.new_execution_location}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, new_execution_location: e.target.checked }))
                      }
                    />
                    Neuer Ausführungsort
                  </label>
                </div>

                {form.new_execution_location ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-zinc-700">Straße*</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.execution_street}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, execution_street: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-700">Hausnummer*</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.execution_house_number}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, execution_house_number: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-700">PLZ*</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.execution_postal_code}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, execution_postal_code: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-700">Ort*</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.execution_city}
                        onChange={(e) => setForm((s) => ({ ...s, execution_city: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-zinc-700">Adresszusatz</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.execution_address_extra}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, execution_address_extra: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-zinc-600">
                    Adresse ist Rechnungsadresse des Kunden.
                  </div>
                )}
              </div>

              <div className="rounded-lg border bg-zinc-50 px-4 py-3">
                <button
                  type="button"
                  className="text-sm font-medium text-zinc-800"
                  onClick={() => setForm((s) => ({ ...s, contact_open: !s.contact_open }))}
                >
                  Kontakt {form.contact_open ? "ausblenden" : "einblenden"}
                </button>

                {form.contact_open ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-zinc-700">Telefon (Festnetz)</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.execution_phone_landline}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, execution_phone_landline: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-700">Telefon (Mobil)</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.execution_phone_mobile}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, execution_phone_mobile: e.target.value }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-zinc-700">E-Mail</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.execution_email}
                        onChange={(e) => setForm((s) => ({ ...s, execution_email: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : null}
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

              <div className="flex items-center justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  className="rounded-md border px-4 py-2 text-sm"
                  onClick={close}
                  disabled={loading}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Speichern..." : "Erstellen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
