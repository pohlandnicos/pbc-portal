'use client';

import { useEffect, useMemo, useRef, useState } from "react";

export default function OfferInvoiceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [offerPrefix, setOfferPrefix] = useState("A-");
  const [offerStart, setOfferStart] = useState("211");
  const [invoicePrefix, setInvoicePrefix] = useState("R-");
  const [invoiceStart, setInvoiceStart] = useState("263");

  const [autoCustomerNumber, setAutoCustomerNumber] = useState(false);

  const [agbPath, setAgbPath] = useState<string | null>(null);
  const [withdrawalPath, setWithdrawalPath] = useState<string | null>(null);

  const agbInputRef = useRef<HTMLInputElement | null>(null);
  const withdrawalInputRef = useRef<HTMLInputElement | null>(null);

  const [paymentDueDays, setPaymentDueDays] = useState("7");
  const [paymentScope, setPaymentScope] = useState<"invoice" | "both">("both");

  const [laborNoteOfferPrivate, setLaborNoteOfferPrivate] = useState(true);
  const [laborNoteOfferBusiness, setLaborNoteOfferBusiness] = useState(true);
  const [laborNoteInvoicePrivate, setLaborNoteInvoicePrivate] = useState(true);
  const [laborNoteInvoiceBusiness, setLaborNoteInvoiceBusiness] = useState(true);

  const nextOfferNumber = useMemo(() => `${offerPrefix}${offerStart}`, [offerPrefix, offerStart]);
  const nextInvoiceNumber = useMemo(
    () => `${invoicePrefix}${invoiceStart}`,
    [invoicePrefix, invoiceStart]
  );

  const invoicePreview = useMemo(() => {
    if (paymentDueDays === "7") return "Der fällige Betrag ist ohne Abzug zahlbar bis zum 03.03.2026.";
    return `Der fällige Betrag ist ohne Abzug zahlbar innerhalb von ${paymentDueDays} Tagen ab Rechnungsdatum.`;
  }, [paymentDueDays]);

  const offerPreview = useMemo(() => {
    return `Der fällige Betrag ist ohne Abzug zahlbar innerhalb von ${paymentDueDays} Tagen ab Rechnungsdatum.`;
  }, [paymentDueDays]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/settings/offer-invoice", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as
          | { data?: any; error?: string }
          | null;

        if (!res.ok) {
          setError(json?.error ?? "Laden fehlgeschlagen");
          return;
        }

        const d = json?.data;
        if (!d) return;

        setOfferPrefix(d.offer_prefix ?? "A-");
        setOfferStart(String(d.offer_next_number ?? 1));
        setInvoicePrefix(d.invoice_prefix ?? "R-");
        setInvoiceStart(String(d.invoice_next_number ?? 1));
        setAutoCustomerNumber(Boolean(d.auto_customer_number));
        setPaymentDueDays(String(d.payment_due_days ?? 7));
        setPaymentScope((d.payment_scope ?? "both") as "invoice" | "both");
        setLaborNoteOfferPrivate(Boolean(d.labor_note_offer_private));
        setLaborNoteOfferBusiness(Boolean(d.labor_note_offer_business));
        setLaborNoteInvoicePrivate(Boolean(d.labor_note_invoice_private));
        setLaborNoteInvoiceBusiness(Boolean(d.labor_note_invoice_business));
        setAgbPath(d.agb_pdf_path ?? null);
        setWithdrawalPath(d.withdrawal_pdf_path ?? null);
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
      const payload = {
        offer_prefix: offerPrefix,
        offer_next_number: Number(offerStart || 1),
        invoice_prefix: invoicePrefix,
        invoice_next_number: Number(invoiceStart || 1),
        auto_customer_number: autoCustomerNumber,
        payment_due_days: Number(paymentDueDays || 7),
        payment_scope: paymentScope,
        labor_note_offer_private: laborNoteOfferPrivate,
        labor_note_offer_business: laborNoteOfferBusiness,
        labor_note_invoice_private: laborNoteInvoicePrivate,
        labor_note_invoice_business: laborNoteInvoiceBusiness,
      };

      const res = await fetch("/api/settings/offer-invoice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as
        | { data?: any; error?: string }
        | null;

      if (!res.ok) {
        setError(json?.error ?? "Speichern fehlgeschlagen");
        return;
      }
    } finally {
      setSaving(false);
    }
  }

  async function uploadPdf(kind: "agb" | "withdrawal", file: File) {
    setError(null);
    const form = new FormData();
    form.set("kind", kind);
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

    const path = json?.data?.path;
    if (kind === "agb") setAgbPath(path ?? null);
    if (kind === "withdrawal") setWithdrawalPath(path ?? null);
  }

  if (loading) {
    return <div className="p-4">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Angebot & Rechnung</h1>
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
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Nummernkreise für Dokumente</div>
            <div className="mt-1 text-sm text-zinc-600">
              Hier kannst Du die Nummernkreise für Deine Angebote und Rechnungen einstellen.
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="col-span-3 text-sm font-semibold text-zinc-900">Angebote</div>

              <div>
                <div className="text-xs text-zinc-600 mb-1">Präfix</div>
                <input
                  value={offerPrefix}
                  onChange={(e) => setOfferPrefix(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Beginnt bei</div>
                <input
                  value={offerStart}
                  onChange={(e) => setOfferStart(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Nächste Angebotsnummer</div>
                <div className="h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 flex items-center text-sm text-zinc-900">
                  {nextOfferNumber}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="col-span-3 text-sm font-semibold text-zinc-900">Rechnungen</div>

              <div>
                <div className="text-xs text-zinc-600 mb-1">Präfix</div>
                <input
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Beginnt bei</div>
                <input
                  value={invoiceStart}
                  onChange={(e) => setInvoiceStart(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="text-xs text-zinc-600 mb-1">Nächste Rechnungsnummer</div>
                <div className="h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 flex items-center text-sm text-zinc-900">
                  {nextInvoiceNumber}
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-4 grid grid-cols-2 gap-6 items-center">
              <div>
                <div className="text-sm font-semibold text-zinc-900">Nummernkreis für Kunden</div>
                <div className="mt-1 text-sm text-zinc-600">
                  Hier kannst Du den Nummernkreis für Deine Kunden einstellen.
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    Kundennummern automatisch vergeben
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    Bei Aktivierung weist das ToolTime jedem Kunden automatisch eine fortlaufende,
                    sich nicht wiederholende Nummer zu.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoCustomerNumber((s) => !s)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    autoCustomerNumber ? "bg-blue-600" : "bg-zinc-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                      autoCustomerNumber ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Rechtliche Hinweise</div>
            <div className="mt-1 text-sm text-zinc-600">
              Hier kannst Du AGB, Widerrufsbelehrung und das Muster-Widerrufsformular Deiner Firma
              hochladen. Diese Dokumente können automatisch mit den Angeboten versendet werden und
              sind in der Webansicht einsehbar.
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-sm font-semibold text-zinc-900">AGB (Allgemeine Geschäftsbedingungen)</div>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                onClick={() => agbInputRef.current?.click()}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100">+</span>
                PDF hochladen
              </button>
              <div className="mt-2 text-xs text-zinc-500">Zulässig sind PDF-Dateien (max. 1 MB).</div>
              {agbPath ? (
                <div className="mt-2 text-xs text-zinc-600 truncate">{agbPath}</div>
              ) : null}
              <input
                ref={agbInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  void uploadPdf("agb", f);
                  e.currentTarget.value = "";
                }}
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-zinc-900">
                Widerrufsbelehrung und Muster-Widerrufsformular
              </div>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                onClick={() => withdrawalInputRef.current?.click()}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100">+</span>
                PDF hochladen
              </button>
              <div className="mt-2 text-xs text-zinc-500">Zulässig sind PDF-Dateien (max. 1 MB).</div>
              {withdrawalPath ? (
                <div className="mt-2 text-xs text-zinc-600 truncate">{withdrawalPath}</div>
              ) : null}
              <input
                ref={withdrawalInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  void uploadPdf("withdrawal", f);
                  e.currentTarget.value = "";
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Zahlungsbedingungen</div>
            <div className="mt-1 text-sm text-zinc-600">
              Hier kannst Du die Zahlungsbedingungen festlegen. Wenn Du sie für eine bestimmte
              Rechnung oder ein Angebot anpassen musst, kannst Du das direkt im
              Erstellungsformular tun.
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Zahlungsziel</div>
              <div className="mt-2 w-40 relative">
                <select
                  value={paymentDueDays}
                  onChange={(e) => setPaymentDueDays(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-9 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="7">7 Tage</option>
                  <option value="14">14 Tage</option>
                  <option value="30">30 Tage</option>
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
              <div className="text-sm font-semibold text-zinc-900">Bereiche</div>
              <div className="mt-2 flex items-center gap-6 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentScope"
                    checked={paymentScope === "invoice"}
                    onChange={() => setPaymentScope("invoice")}
                  />
                  Rechnungen
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentScope"
                    checked={paymentScope === "both"}
                    onChange={() => setPaymentScope("both")}
                  />
                  Rechnungen und Angebote
                </label>
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-4 space-y-3">
              <div>
                <div className="text-xs font-semibold text-zinc-700">Vorschau in Rechnungen</div>
                <div className="mt-1 text-sm text-zinc-700">{invoicePreview}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-700">Vorschau in Angeboten</div>
                <div className="mt-1 text-sm text-zinc-700">{offerPreview}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Ausweisung des Lohnkostenanteils</div>
            <div className="mt-1 text-sm text-zinc-600">
              Hier kannst Du den Hinweis zum Lohnkostenanteil in allen Angeboten und Rechnungen
              ein- oder ausblenden.
            </div>
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <div className="h-20 rounded bg-white" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Lohnkostenanteil in Angeboten ausweisen</div>
              <div className="mt-3 space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={laborNoteOfferPrivate}
                    onChange={(e) => setLaborNoteOfferPrivate(e.target.checked)}
                  />
                  Für Privatkunden
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={laborNoteOfferBusiness}
                    onChange={(e) => setLaborNoteOfferBusiness(e.target.checked)}
                  />
                  Für Geschäftskunden
                </label>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-zinc-900">Lohnkostenanteil in Rechnungen ausweisen</div>
              <div className="mt-3 space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={laborNoteInvoicePrivate}
                    onChange={(e) => setLaborNoteInvoicePrivate(e.target.checked)}
                  />
                  Für Privatkunden
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={laborNoteInvoiceBusiness}
                    onChange={(e) => setLaborNoteInvoiceBusiness(e.target.checked)}
                  />
                  Für Geschäftskunden
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
