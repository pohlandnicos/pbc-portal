"use client";

import { useMemo, useState } from "react";
import { z } from "zod";

type Props = {
  onCreated: () => void;
};

const baseSchema = z.object({
  type: z.enum(["private", "company"]),

  company_name: z.string().optional(),
  salutation: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),

  description: z.string().optional(),
  customer_number: z.string().optional(),
  leitweg_id: z.string().optional(),
  supplier_number: z.string().optional(),
  vat_id: z.string().optional(),
  vendor_number: z.string().optional(),

  billing_street: z.string().trim().min(1, "Straße ist Pflichtfeld"),
  billing_house_number: z.string().trim().min(1, "Hausnummer ist Pflichtfeld"),
  billing_address_extra: z.string().optional(),
  billing_postal_code: z.string().trim().min(1, "PLZ ist Pflichtfeld"),
  billing_city: z.string().trim().min(1, "Ort ist Pflichtfeld"),

  phone_landline: z.string().optional(),
  phone_mobile: z.string().optional(),
  email: z.string().optional(),
});

const schema = baseSchema.superRefine((val, ctx) => {
  if (val.type === "company") {
    if (!val.company_name || val.company_name.trim().length === 0) {
      ctx.addIssue({ code: "custom", message: "company_name ist Pflichtfeld", path: ["company_name"] });
    }
  }
  if (val.type === "private") {
    if (!val.salutation || val.salutation.trim().length === 0) {
      ctx.addIssue({ code: "custom", message: "salutation ist Pflichtfeld", path: ["salutation"] });
    }
    if (!val.first_name || val.first_name.trim().length === 0) {
      ctx.addIssue({ code: "custom", message: "first_name ist Pflichtfeld", path: ["first_name"] });
    }
    if (!val.last_name || val.last_name.trim().length === 0) {
      ctx.addIssue({ code: "custom", message: "last_name ist Pflichtfeld", path: ["last_name"] });
    }
  }

  if (val.email && val.email.trim().length > 0) {
    const res = z.string().email().safeParse(val.email.trim());
    if (!res.success) {
      ctx.addIssue({ code: "custom", message: "Ungültige E-Mail", path: ["email"] });
    }
  }

  if (val.leitweg_id && val.leitweg_id.trim().length > 0 && val.type !== "company") {
    ctx.addIssue({ code: "custom", message: "leitweg_id nur für Firmenkunden", path: ["leitweg_id"] });
  }
});

export function CustomerCreateDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "company" as "company" | "private",

    company_name: "",
    salutation: "",
    first_name: "",
    last_name: "",

    description: "",
    customer_number: "",
    leitweg_id: "",
    supplier_number: "",
    vat_id: "",
    vendor_number: "",

    billing_street: "",
    billing_house_number: "",
    billing_address_extra: "",
    billing_postal_code: "",
    billing_city: "",

    phone_landline: "",
    phone_mobile: "",
    email: "",
  });

  const requiredError = useMemo(() => {
    const parsed = schema.safeParse(form);
    if (parsed.success) return null;
    const first = parsed.error.issues[0];
    return first?.message ?? "Ungültige Eingabe";
  }, [form]);

  function close() {
    setOpen(false);
    setError(null);
    setLoading(false);
    setAdvancedOpen(false);
    setContactOpen(false);
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
      const payload: Record<string, unknown> = {
        type: parsed.data.type,
        billing_street: parsed.data.billing_street,
        billing_house_number: parsed.data.billing_house_number,
        billing_address_extra: parsed.data.billing_address_extra || undefined,
        billing_postal_code: parsed.data.billing_postal_code,
        billing_city: parsed.data.billing_city,
        description: parsed.data.description || undefined,
        customer_number: parsed.data.customer_number || undefined,
        supplier_number: parsed.data.supplier_number || undefined,
        vat_id: parsed.data.vat_id || undefined,
        vendor_number: parsed.data.vendor_number || undefined,
      };

      if (parsed.data.type === "company") {
        payload.company_name = parsed.data.company_name;
        payload.leitweg_id = parsed.data.leitweg_id || undefined;
      } else {
        payload.salutation = parsed.data.salutation;
        payload.first_name = parsed.data.first_name;
        payload.last_name = parsed.data.last_name;
      }

      const res = await fetch("/api/customers", {
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

      const customerId = json?.data?.id;

      const contactFilled =
        (parsed.data.phone_landline ?? "").trim().length > 0 ||
        (parsed.data.phone_mobile ?? "").trim().length > 0 ||
        (parsed.data.email ?? "").trim().length > 0;

      if (customerId && contactFilled) {
        const contactPayload = {
          customer_id: customerId,
          phone_landline: parsed.data.phone_landline || undefined,
          phone_mobile: parsed.data.phone_mobile || undefined,
          email: parsed.data.email || undefined,
        };

        await fetch("/api/customer-contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactPayload),
        });
      }

      close();
      onCreated();
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
          Kunde hinzufügen
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-base font-semibold">Kunde hinzufügen</div>
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
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="type"
                    checked={form.type === "company"}
                    onChange={() => setForm((s) => ({ ...s, type: "company" }))}
                  />
                  Firmenkunde
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="type"
                    checked={form.type === "private"}
                    onChange={() => setForm((s) => ({ ...s, type: "private" }))}
                  />
                  Privatkunde
                </label>
              </div>

              {form.type === "company" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-sm text-zinc-700">Firma*</label>
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      value={form.company_name}
                      onChange={(e) => setForm((s) => ({ ...s, company_name: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-sm text-zinc-700">Anrede*</label>
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      value={form.salutation}
                      onChange={(e) => setForm((s) => ({ ...s, salutation: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-700">Vorname*</label>
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      value={form.first_name}
                      onChange={(e) => setForm((s) => ({ ...s, first_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-700">Nachname*</label>
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      value={form.last_name}
                      onChange={(e) => setForm((s) => ({ ...s, last_name: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm text-zinc-700">Straße*</label>
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={form.billing_street}
                    onChange={(e) => setForm((s) => ({ ...s, billing_street: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-700">Hausnummer*</label>
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={form.billing_house_number}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, billing_house_number: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-700">PLZ*</label>
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={form.billing_postal_code}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, billing_postal_code: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-700">Ort*</label>
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={form.billing_city}
                    onChange={(e) => setForm((s) => ({ ...s, billing_city: e.target.value }))}
                  />
                </div>
              </div>

              <div className="rounded-lg border bg-zinc-50 px-4 py-3">
                <button
                  type="button"
                  className="text-sm font-medium text-zinc-800"
                  onClick={() => setAdvancedOpen((s) => !s)}
                >
                  Weitere Felder {advancedOpen ? "ausblenden" : "einblenden"}
                </button>

                {advancedOpen ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="text-sm text-zinc-700">Beschreibung</label>
                      <textarea
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.description}
                        onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-zinc-700">Kundennummer</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.customer_number}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, customer_number: e.target.value }))
                        }
                      />
                    </div>

                    {form.type === "company" ? (
                      <div>
                        <label className="text-sm text-zinc-700">Leitweg-ID</label>
                        <input
                          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                          value={form.leitweg_id}
                          onChange={(e) =>
                            setForm((s) => ({ ...s, leitweg_id: e.target.value }))
                          }
                        />
                      </div>
                    ) : null}

                    <div>
                      <label className="text-sm text-zinc-700">Lieferantennr.</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.supplier_number}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, supplier_number: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm text-zinc-700">USt-ID</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.vat_id}
                        onChange={(e) => setForm((s) => ({ ...s, vat_id: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-zinc-700">Vendor Nr.</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.vendor_number}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, vendor_number: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm text-zinc-700">Adresszusatz</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.billing_address_extra}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, billing_address_extra: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border bg-zinc-50 px-4 py-3">
                <button
                  type="button"
                  className="text-sm font-medium text-zinc-800"
                  onClick={() => setContactOpen((s) => !s)}
                >
                  Kontakt {contactOpen ? "ausblenden" : "einblenden"}
                </button>

                {contactOpen ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-zinc-700">Telefon (Festnetz)</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.phone_landline}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, phone_landline: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-700">Telefon (Mobil)</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.phone_mobile}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, phone_mobile: e.target.value }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-zinc-700">E-Mail</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        value={form.email}
                        onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : requiredError ? (
                <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
                  {requiredError}
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
