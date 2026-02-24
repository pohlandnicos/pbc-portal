"use client";

import { useMemo, useState } from "react";
import { z } from "zod";

type Props = {
  onCreated: (customerId?: string) => void;
  renderTrigger?: (open: () => void) => React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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

export function CustomerCreateDialog({ onCreated, renderTrigger, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  function setOpen(next: boolean) {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  }

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

  const inputClass =
    "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  const toggleClass =
    "flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700";

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
      onCreated(customerId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setOpen(true))
      ) : (
        <div className="flex items-center justify-end">
          <button
            type="button"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            onClick={() => setOpen(true)}
          >
            Kunde hinzufügen
          </button>
        </div>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="text-base font-semibold">Kunde erstellen</div>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
                onClick={close}
              >
                ✕
              </button>
            </div>

            <form className="flex max-h-[80vh] flex-col" onSubmit={onSubmit}>
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                <div className="flex gap-6">
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
                        className={inputClass}
                        value={form.company_name}
                        onChange={(e) => setForm((s) => ({ ...s, company_name: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="text-sm text-zinc-700">Anrede*</label>
                      <select
                        className={inputClass}
                        value={form.salutation}
                        onChange={(e) => setForm((s) => ({ ...s, salutation: e.target.value }))}
                      >
                        <option value="">-</option>
                        <option value="Herr">Herr</option>
                        <option value="Frau">Frau</option>
                        <option value="Familie">Familie</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-zinc-700">Vorname*</label>
                      <input
                        className={inputClass}
                        value={form.first_name}
                        onChange={(e) => setForm((s) => ({ ...s, first_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-700">Nachname*</label>
                      <input
                        className={inputClass}
                        value={form.last_name}
                        onChange={(e) => setForm((s) => ({ ...s, last_name: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

              <div>
                <button
                  type="button"
                  className={toggleClass}
                  onClick={() => setAdvancedOpen((s) => !s)}
                >
                  <span className="text-zinc-500">{advancedOpen ? "▾" : "▸"}</span>
                  Details {advancedOpen ? "ausblenden" : "einblenden"}
                </button>

                {advancedOpen ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="text-sm text-zinc-700">Beschreibung</label>
                      <textarea
                        className={inputClass}
                        value={form.description}
                        onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-zinc-700">Kundennummer</label>
                      <input
                        className={inputClass}
                        value={form.customer_number}
                        placeholder="Optional"
                        onChange={(e) =>
                          setForm((s) => ({ ...s, customer_number: e.target.value }))
                        }
                      />
                    </div>

                    {form.type === "company" ? (
                      <div>
                        <label className="text-sm text-zinc-700">Leitweg-ID</label>
                        <input
                          className={inputClass}
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
                        className={inputClass}
                        value={form.supplier_number}
                        placeholder="Optional"
                        onChange={(e) =>
                          setForm((s) => ({ ...s, supplier_number: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm text-zinc-700">USt-ID</label>
                      <input
                        className={inputClass}
                        value={form.vat_id}
                        placeholder="Optional"
                        onChange={(e) => setForm((s) => ({ ...s, vat_id: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-zinc-700">Vendor Nr.</label>
                      <input
                        className={inputClass}
                        value={form.vendor_number}
                        placeholder="Optional"
                        onChange={(e) =>
                          setForm((s) => ({ ...s, vendor_number: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <div className="text-sm font-semibold text-zinc-900">Rechnungsadresse</div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm text-zinc-700">Straße*</label>
                  <input
                    className={inputClass}
                    value={form.billing_street}
                    onChange={(e) => setForm((s) => ({ ...s, billing_street: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-700">Hausnummer*</label>
                  <input
                    className={inputClass}
                    value={form.billing_house_number}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, billing_house_number: e.target.value }))
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-zinc-700">Adresszusatz</label>
                  <input
                    className={inputClass}
                    value={form.billing_address_extra}
                    placeholder="Firma, c/o – Optional"
                    onChange={(e) =>
                      setForm((s) => ({ ...s, billing_address_extra: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-700">PLZ*</label>
                  <input
                    className={inputClass}
                    value={form.billing_postal_code}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, billing_postal_code: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-700">Ort*</label>
                  <input
                    className={inputClass}
                    value={form.billing_city}
                    onChange={(e) => setForm((s) => ({ ...s, billing_city: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-zinc-700">Land</label>
                  <select className={inputClass} value="Deutschland" disabled>
                    <option value="Deutschland">Deutschland</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className={toggleClass}
                  onClick={() => setContactOpen((s) => !s)}
                >
                  <span className="text-zinc-500">{contactOpen ? "▾" : "▸"}</span>
                  Kontaktdaten {contactOpen ? "ausblenden" : "einblenden"}
                </button>

                {contactOpen ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-zinc-700">Telefon (Festnetz)</label>
                      <input
                        className={inputClass}
                        value={form.phone_landline}
                        placeholder="Optional"
                        onChange={(e) =>
                          setForm((s) => ({ ...s, phone_landline: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-700">Telefon (Mobil)</label>
                      <input
                        className={inputClass}
                        value={form.phone_mobile}
                        placeholder="Optional"
                        onChange={(e) =>
                          setForm((s) => ({ ...s, phone_mobile: e.target.value }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-zinc-700">E-Mail</label>
                      <input
                        className={inputClass}
                        value={form.email}
                        placeholder="Optional"
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

              </div>

              <div className="flex items-center justify-end gap-2 border-t bg-white px-6 py-4">
                <button
                  type="button"
                  className="rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-200 disabled:opacity-50"
                  onClick={close}
                  disabled={loading}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    "Speichern..."
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/20">+</span>
                      Erstellen
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
