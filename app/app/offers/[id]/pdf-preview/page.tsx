"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Head from "next/head";

type OfferCustomer = {
  type: "private" | "company";
  company_name: string | null;
  salutation: string | null;
  first_name: string | null;
  last_name: string | null;
  billing_street: string;
  billing_house_number: string;
  billing_address_extra: string | null;
  billing_postal_code: string;
  billing_city: string;
};

type OfferProjectLocation = {
  street: string;
  house_number: string;
  address_extra: string | null;
  postal_code: string;
  city: string;
  is_billing_address: boolean;
};

type OfferProject = {
  title: string;
  project_locations: OfferProjectLocation[] | null;
};

type OfferItem = {
  id: string;
  position_index: string;
  name: string;
  description: string | null;
  qty: number;
  unit: string;
  unit_price: number;
  line_total: number;
};

type OfferGroup = {
  id: string;
  index: number;
  title: string;
  offer_items: OfferItem[];
};

type OfferData = {
  id: string;
  title: string;
  offer_number?: string | null;
  offer_date: string;
  project_number?: string | null;
  intro_salutation: string | null;
  intro_body_html: string | null;
  outro_body_html?: string | null;
  total_net?: number | null;
  total_tax?: number | null;
  total_gross?: number | null;
  tax_rate?: number | null;
  customers: OfferCustomer | null;
  projects: OfferProject | null;
  groups: OfferGroup[];
};

type TextLayoutSettings = {
  logo_enabled?: boolean | null;
  logo_position?: "left" | "right" | null;
  logo_size?: "small" | "medium" | "large" | null;
  logo_url?: string | null;
  sender_line_enabled?: boolean | null;
  footer_enabled?: boolean | null;
  footer_mode?: "standard" | "custom" | null;
  footer_custom_html?: string | null;

  company_name?: string | null;
  street?: string | null;
  house_number?: string | null;
  address_extra?: string | null;
  postal_code?: string | null;
  city?: string | null;
  tax_number?: string | null;
  vat_id?: string | null;

  bank_account_holder?: string | null;
  iban?: string | null;
  bic?: string | null;
  bank_name?: string | null;

  website?: string | null;
  email?: string | null;
  mobile?: string | null;
  phone?: string | null;

  legal_form?: string | null;
  owner_name?: string | null;
  register_court?: string | null;
  hbr_number?: string | null;
};

function formatDateDE(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function currencyEUR(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

type PagedGroup = {
  id: string;
  index: number;
  title: string;
  offer_items: OfferItem[];
};

function paginateOfferGroups(groups: OfferGroup[]) {
  const FIRST_PAGE_CAPACITY = 18;
  const OTHER_PAGE_CAPACITY = 26;

  const pages: PagedGroup[][] = [];
  let current: PagedGroup[] = [];
  let remaining = FIRST_PAGE_CAPACITY;

  function pushPageIfNeeded() {
    if (current.length > 0) {
      pages.push(current);
      current = [];
    }
    remaining = OTHER_PAGE_CAPACITY;
  }

  for (const g of (groups ?? []).slice().sort((a, b) => a.index - b.index)) {
    const items = (g.offer_items ?? []).slice();
    let offset = 0;

    while (offset < items.length) {
      const needsHeaderRows = current.some((x) => x.id === g.id) ? 0 : 2;
      const availableForThisGroup = Math.max(0, remaining - needsHeaderRows);

      if (availableForThisGroup === 0) {
        pushPageIfNeeded();
        continue;
      }

      const take = Math.min(availableForThisGroup, items.length - offset);
      const chunk = items.slice(offset, offset + take);
      offset += take;

      const existingIndex = current.findIndex((x) => x.id === g.id);
      if (existingIndex >= 0) {
        current[existingIndex] = {
          ...current[existingIndex],
          offer_items: [...current[existingIndex].offer_items, ...chunk],
        };
      } else {
        current.push({ id: g.id, index: g.index, title: g.title, offer_items: chunk });
        remaining -= needsHeaderRows;
      }

      remaining -= chunk.length;

      if (remaining <= 0 && offset < items.length) {
        pushPageIfNeeded();
      }
    }

    if (remaining <= 0) {
      pushPageIfNeeded();
    }
  }

  if (current.length > 0) pages.push(current);
  if (pages.length === 0) pages.push([]);
  return pages;
}

export default function OfferPdfPreviewPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OfferData | null>(null);
  const [layout, setLayout] = useState<TextLayoutSettings | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) {
        setError("Ungültige Angebots-ID");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [offerRes, layoutRes] = await Promise.all([
          fetch(`/api/offers/${id}`, { cache: "no-store" }),
          fetch("/api/settings/text-layout", { cache: "no-store" }),
        ]);

        const offerJson = (await offerRes.json().catch(() => null)) as
          | { data?: OfferData; error?: string; message?: string }
          | null;
        const layoutJson = (await layoutRes.json().catch(() => null)) as
          | { data?: TextLayoutSettings; error?: string; message?: string }
          | null;

        if (!offerRes.ok) {
          setError(
            offerJson?.message ??
              offerJson?.error ??
              `Laden fehlgeschlagen (HTTP ${offerRes.status})`
          );
          return;
        }

        if (layoutRes.ok) {
          setLayout(layoutJson?.data ?? null);
        }

        setData(offerJson?.data ?? null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  const recipientLines = useMemo(() => {
    const c = data?.customers;
    if (!c) return [] as string[];

    const name =
      c.type === "company"
        ? (c.company_name ?? "").trim()
        : `${c.salutation ?? ""} ${c.first_name ?? ""} ${c.last_name ?? ""}`.replace(/\s+/g, " ").trim();

    const lines: string[] = [];
    if (name) lines.push(name);
    if (c.billing_address_extra) lines.push(c.billing_address_extra);
    lines.push(`${c.billing_street} ${c.billing_house_number}`.trim());
    lines.push(`${c.billing_postal_code} ${c.billing_city}`.trim());
    return lines;
  }, [data?.customers]);

  const executionLocation = useMemo(() => {
    const p = data?.projects;
    if (!p || !Array.isArray(p.project_locations) || p.project_locations.length === 0) return null;
    const loc = p.project_locations.find((x) => x.is_billing_address) ?? p.project_locations[0];
    if (!loc) return null;
    const street = `${loc.street} ${loc.house_number}`.trim();
    const extra = (loc.address_extra ?? "").trim();
    const city = `${loc.postal_code} ${loc.city}`.trim();
    return [street, extra, city].filter(Boolean).join(", ");
  }, [data?.projects]);

  const senderLine = useMemo(() => {
    if (!layout?.sender_line_enabled) return null;
    const company = (layout.company_name ?? "").trim();
    const street = `${layout.street ?? ""} ${layout.house_number ?? ""}`.replace(/\s+/g, " ").trim();
    const city = `${layout.postal_code ?? ""} ${layout.city ?? ""}`.replace(/\s+/g, " ").trim();
    return [company, street, city].filter(Boolean).join(" · ") || null;
  }, [layout]);

  const pages = useMemo(() => paginateOfferGroups(data?.groups ?? []), [data?.groups]);

  const computedNetTotal = useMemo(() => {
    const groups = data?.groups ?? [];
    let sum = 0;
    for (const g of groups) {
      for (const it of g.offer_items ?? []) {
        sum += Number(it.line_total ?? 0);
      }
    }
    return sum;
  }, [data?.groups]);

  const taxRate = useMemo(() => {
    const r = data?.tax_rate;
    if (typeof r === "number" && Number.isFinite(r)) return r;
    return 19;
  }, [data?.tax_rate]);

  const finalNet = useMemo(() => {
    const v = data?.total_net;
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
    return computedNetTotal;
  }, [computedNetTotal, data?.total_net]);

  const finalTax = useMemo(() => {
    const v = data?.total_tax;
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
    return (finalNet * taxRate) / 100;
  }, [data?.total_tax, finalNet, taxRate]);

  const finalGross = useMemo(() => {
    const v = data?.total_gross;
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
    return finalNet + finalTax;
  }, [data?.total_gross, finalNet, finalTax]);

  const logoSizePx = useMemo(() => {
    const size = layout?.logo_size ?? "medium";
    if (size === "small") return 150;
    if (size === "large") return 240;
    return 190;
  }, [layout?.logo_size]);

  const footerColumns = useMemo(() => {
    if (!layout?.footer_enabled) return null;
    if (layout.footer_mode === "custom" && layout.footer_custom_html) {
      return { mode: "custom" as const, html: layout.footer_custom_html };
    }

    const address: string[] = [];
    if (layout?.company_name) address.push(layout.company_name);
    const line1 = `${layout?.street ?? ""} ${layout?.house_number ?? ""}`.replace(/\s+/g, " ").trim();
    const line2 = (layout?.address_extra ?? "").trim();
    const line3 = `${layout?.postal_code ?? ""} ${layout?.city ?? ""}`.replace(/\s+/g, " ").trim();
    if (line1) address.push(line1);
    if (line2) address.push(line2);
    if (line3) address.push(line3);

    const bank: string[] = [];
    if (layout?.bank_account_holder) bank.push(layout.bank_account_holder);
    if (layout?.bank_name) bank.push(layout.bank_name);
    if (layout?.iban) bank.push(layout.iban);
    if (layout?.bic) bank.push(layout.bic);

    const contact: string[] = [];
    if (layout?.website) contact.push(layout.website);
    if (layout?.email) contact.push(layout.email);
    if (layout?.phone) contact.push(layout.phone);
    if (layout?.mobile) contact.push(layout.mobile);

    const legal: string[] = [];
    const legalForm = (layout?.legal_form ?? "").trim();
    const owner = (layout?.owner_name ?? "").trim();
    const court = (layout?.register_court ?? "").trim();
    const hbr = (layout?.hbr_number ?? "").trim();
    if (legalForm) legal.push(legalForm);
    if (owner) legal.push(owner);
    if (court) legal.push(court);
    if (hbr) legal.push(hbr);
    if (layout?.tax_number) legal.push(`St.-Nr. ${layout.tax_number}`);
    if (layout?.vat_id) legal.push(`USt-IdNr. ${layout.vat_id}`);

    return {
      mode: "standard" as const,
      address,
      bank,
      contact,
      legal,
    };
  }, [layout]);

  if (loading) {
    return <div className="min-h-screen bg-zinc-50 p-6 text-sm text-zinc-700">Lädt...</div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mb-4 text-sm text-zinc-700">{error ?? "Fehler"}</div>
        <Link href={id ? `/app/offers/${id}` : "/app/offers"} className="text-sm text-blue-600 hover:text-blue-700">
          Zurück
        </Link>
      </div>
    );
  }

  // Detect if we're in an iframe
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <>
      {isInIframe && (
        <style>{`
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden !important;
            overflow-y: scroll !important;
            width: 100vw !important;
            max-width: 100vw !important;
            background: white !important;
            scrollbar-gutter: stable !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
          }
          main > div {
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
          }
          ::-webkit-scrollbar {
            width: 0px !important;
            background: transparent !important;
          }
        `}</style>
      )}
      <div className={`min-h-screen ${isInIframe ? 'bg-white m-0 p-0' : 'bg-zinc-100 px-4 py-8'}`}>
        <div className={`${isInIframe ? 'w-full max-w-full space-y-0' : 'mx-auto max-w-[900px] space-y-8'}`}>
          {pages.map((pageGroups, pageIndex) => {
            const pageNo = pageIndex + 1;
            const pageCount = pages.length;
            const isFirst = pageIndex === 0;
            const isLast = pageIndex === pageCount - 1;

          const runningSubtotalNet = pages.slice(0, pageIndex + 1).reduce((sumP, pg) => {
            return (
              sumP +
              pg.reduce((sumG, g) => {
                return (
                  sumG +
                  (g.offer_items ?? []).reduce((sumI, it) => sumI + Number(it.line_total ?? 0), 0)
                );
              }, 0)
            );
          }, 0);

          return (
            <div
              key={pageIndex}
              className={`${isInIframe ? 'w-full' : 'mx-auto rounded shadow'} bg-white`}
              style={isInIframe ? { minHeight: "297mm", margin: 0, padding: 0 } : { width: "210mm", height: "297mm" }}
            >
              <div
                className="flex h-full flex-col text-[12px] leading-[1.35] text-zinc-900"
                style={isInIframe 
                  ? { padding: 0, margin: 0 }
                  : { paddingLeft: "22mm", paddingRight: "18mm", paddingTop: "16mm", paddingBottom: "6mm" }
                }
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1" />
                    {layout?.logo_enabled && layout.logo_url ? (
                      <div
                        style={{
                          width: `${logoSizePx}px`,
                          height: `${logoSizePx}px`,
                          marginTop: "-10mm",
                        }}
                      >
                        <img
                          src={layout.logo_url}
                          alt="Logo"
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-[90mm_1fr] gap-6" style={{ marginTop: "10mm", minHeight: "45mm" }}>
                    <div>
                      {senderLine ? <div className="mb-1 text-[10px] text-zinc-600">{senderLine}</div> : null}
                      {recipientLines.map((l, idx) => (
                        <div key={idx}>{l}</div>
                      ))}
                    </div>

                    <div className="text-right">
                      <div className="flex justify-end gap-2">
                        <div className="text-zinc-600">Angebotsdatum:</div>
                        <div>{formatDateDE(data.offer_date)}</div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <div className="text-zinc-600">Projektnummer:</div>
                        <div>{data.project_number ?? ""}</div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <div className="text-zinc-600">Angebotsnummer:</div>
                        <div>{data.offer_number ?? data.id}</div>
                      </div>
                    </div>
                  </div>

                  {isFirst ? (
                    <div className="mt-4">
                      <div className="text-[22px] font-semibold">{data.title}</div>
                      {executionLocation ? (
                        <div className="mt-2 text-[11px] text-zinc-700">
                          Ausführungsort: {executionLocation}
                        </div>
                      ) : null}
                      <div className="mt-4 text-[12px]">
                        <div className="font-normal">{data.intro_salutation ?? "Sehr geehrte Damen und Herren,"}</div>
                        <div className="mt-1 text-zinc-800">
                          {data.intro_body_html
                            ? data.intro_body_html.replace(/<[^>]*>/g, "").trim()
                            : "Herzlichen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen hiermit folgendes Angebot:"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="text-[14px] font-semibold">{data.title}</div>
                    </div>
                  )}
                </div>

                <div className={isLast ? "overflow-hidden pt-4" : "flex-1 overflow-hidden pt-4"}>
                  {isFirst ? <div className="text-[12px] font-semibold">Positionsübersicht</div> : null}
                  {pageGroups.map((g) => (
                    <div key={`${pageIndex}-${g.id}`} className="mt-6">
                      <div className="mb-2 text-[12px] font-semibold">{g.title}</div>
                      <div className="border-b border-zinc-300 pb-1">
                        <div className="grid grid-cols-[52px_1fr_64px_60px_90px_90px] gap-3 text-[10px] text-zinc-600">
                          <div>Pos.</div>
                          <div>Bezeichnung</div>
                          <div className="text-right">Menge</div>
                          <div>Einheit</div>
                          <div className="text-right">Einzelpreis</div>
                          <div className="text-right">Gesamtpreis</div>
                        </div>
                      </div>

                      <div>
                        {g.offer_items.map((it, idx) => (
                          <div key={it.id} className="border-b border-zinc-200 py-3">
                            <div className="grid grid-cols-[52px_1fr_64px_60px_90px_90px] gap-3">
                              <div className="text-[10px] text-zinc-600">{it.position_index ?? idx + 1}</div>
                              <div>
                                <div className="text-[11px] font-semibold">{it.name}</div>
                                {it.description ? (
                                  <div className="mt-1 text-[10px] text-zinc-700">{it.description}</div>
                                ) : null}
                              </div>
                              <div className="text-right text-[11px]">{String(it.qty).replace(".", ",")}</div>
                              <div className="text-[11px]">{it.unit}</div>
                              <div className="text-right text-[11px]">{currencyEUR(it.unit_price)}</div>
                              <div className="text-right text-[11px]">{currencyEUR(it.line_total)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {!isLast ? (
                  <div className="mt-2 flex justify-end">
                    <div className="w-[90mm] border-t border-zinc-300 pt-2">
                      <div className="flex items-baseline justify-between text-[11px]">
                        <div className="text-zinc-700">Zwischensumme</div>
                        <div className="font-semibold">{currencyEUR(runningSubtotalNet)}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {isLast ? (
                  <div className="mt-2 flex justify-end">
                    <div className="w-[90mm] pt-3">
                      <div className="flex items-baseline justify-between text-[11px]">
                        <div className="text-zinc-700">Gesamt Netto</div>
                        <div className="font-semibold">{currencyEUR(finalNet)}</div>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between text-[11px]">
                        <div className="text-zinc-700">{taxRate} % Umsatzsteuer</div>
                        <div className="font-semibold">{currencyEUR(finalTax)}</div>
                      </div>
                      <div className="mt-3 flex items-baseline justify-between text-[14px] font-semibold">
                        <div>Gesamtbetrag</div>
                        <div>{currencyEUR(finalGross)}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {isLast && data.outro_body_html ? (
                  <div className="mt-6 text-[12px] text-zinc-800">
                    {data.outro_body_html.replace(/<[^>]*>/g, "").trim()}
                  </div>
                ) : null}

                <div className="flex-1" />

                {footerColumns ? (
                  <div className="mt-auto border-t border-zinc-300 pt-2">
                    {footerColumns.mode === "custom" ? (
                      <div
                        className="text-[10px] text-zinc-900"
                        dangerouslySetInnerHTML={{ __html: footerColumns.html }}
                      />
                    ) : (
                      <div className="grid grid-cols-4 gap-6 text-[10px]">
                        <div>
                          <div className="mb-2 font-semibold">Anschrift</div>
                          {footerColumns.address.map((l, idx) => (
                            <div key={idx}>{l}</div>
                          ))}
                        </div>
                        <div>
                          <div className="mb-2 font-semibold">Bankverbindung</div>
                          {footerColumns.bank.length ? (
                            footerColumns.bank.map((l, idx) => <div key={idx}>{l}</div>)
                          ) : (
                            <div className="text-zinc-500">—</div>
                          )}
                        </div>
                        <div>
                          <div className="mb-2 font-semibold">Kontakt</div>
                          {footerColumns.contact.length ? (
                            footerColumns.contact.map((l, idx) => <div key={idx}>{l}</div>)
                          ) : (
                            <div className="text-zinc-500">—</div>
                          )}
                        </div>
                        <div>
                          <div className="mb-2 font-semibold">Unternehmensdaten</div>
                          {footerColumns.legal.length ? (
                            footerColumns.legal.map((l, idx) => <div key={idx}>{l}</div>)
                          ) : (
                            <div className="text-zinc-500">—</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-right text-[10px] text-zinc-600">Seite {pageNo}/{pageCount}</div>
                  </div>
                ) : (
                  <div className="mt-auto pt-2 text-right text-[10px] text-zinc-600">Seite {pageNo}/{pageCount}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}
