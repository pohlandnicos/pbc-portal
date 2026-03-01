"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

function htmlToPlainTextPreserveLines(html: string) {
  if (!html) return "";
  const blockTags = "p|div|li|ul|ol|h1|h2|h3|h4|h5|h6|blockquote|pre";
  return (
    html
      // Normalize various newline encodings that can come from editors/storage.
      // - literal "\\n" sequences
      // - CRLF
      // - Unicode line separators
      .replace(/\\n/g, "\n")
      .replace(/\u2028|\u2029/g, "\n")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Line breaks
      .replace(/<\s*br\b[^>]*>/gi, "\n")
      // Treat closing block tags as newlines (handles attributes/whitespace variations)
      .replace(new RegExp(`<\\s*\\/(?:${blockTags})\\s*>`, "gi"), "\n")
      // Strip opening block tags (regardless of attributes)
      .replace(new RegExp(`<\\s*(?:${blockTags})\\b[^>]*>`, "gi"), "")
      // List items: prefix bullet for readability
      .replace(/\n\s*\n\s*-\s*/g, "\n- ")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

type PagedGroup = {
  id: string;
  index: number;
  title: string;
  offer_items: OfferItem[];
};

function paginateOfferGroups(groups: OfferGroup[]) {
  // These capacities are heuristics ("row units") used to avoid clipping at the page bottom.
  // We keep them conservative because the last page also contains totals + footer.
  const FIRST_PAGE_CAPACITY = 20;
  const OTHER_PAGE_CAPACITY = 30;
  const SAFETY_ROWS = 4;

  const itemUnits = (it: OfferItem) => {
    // Each item row contains name + (optional) description.
    // Treat description as additional height so we page-break before clipping.
    return it.description && String(it.description).trim() ? 2 : 1;
  };

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
      // If we're too close to the bottom, start a new page before adding more content.
      if (remaining - needsHeaderRows <= SAFETY_ROWS) {
        pushPageIfNeeded();
        continue;
      }

      const availableForThisGroup = Math.max(0, remaining - needsHeaderRows - SAFETY_ROWS);

      if (availableForThisGroup === 0) {
        pushPageIfNeeded();
        continue;
      }

      // Take as many items as fit into the available row-units.
      let used = 0;
      let takeCount = 0;
      while (offset + takeCount < items.length) {
        const u = itemUnits(items[offset + takeCount]);
        if (takeCount > 0 && used + u > availableForThisGroup) break;
        if (takeCount === 0 && u > availableForThisGroup) {
          // Always take at least one item to prevent infinite loops.
          takeCount = 1;
          used = u;
          break;
        }
        if (used + u > availableForThisGroup) break;
        used += u;
        takeCount += 1;
      }
      const chunk = items.slice(offset, offset + takeCount);
      offset += takeCount;

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

      // Subtract the row-units rather than the raw item count.
      remaining -= chunk.reduce((sum, it) => sum + itemUnits(it), 0);

      if (remaining <= SAFETY_ROWS && offset < items.length) {
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

  const [isInIframe, setIsInIframe] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement | null>(null);
  const [iframeScale, setIframeScale] = useState(1);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  useEffect(() => {
    if (!isInIframe) return;

    const updateScale = () => {
      const el = iframeContainerRef.current;
      if (!el) return;

      const cs = window.getComputedStyle(el);
      const padL = Number.parseFloat(cs.paddingLeft || "0") || 0;
      const padR = Number.parseFloat(cs.paddingRight || "0") || 0;

      // A4 width in CSS units (as used in the page style below)
      const pageWidthMm = 210;
      const pxPerMm = 96 / 25.4;
      const pageWidthPx = pageWidthMm * pxPerMm;

      // Subtract a few extra pixels for borders/shadows and rounding errors,
      // otherwise the scaled A4 can clip on the right edge in narrow panes.
      const fudgePx = 12;
      const available = Math.max(0, el.clientWidth - padL - padR - fudgePx);
      if (!available) return;

      // Fit page into available width (never upscale)
      // Use a small safety margin so borders/shadows never cause overflow.
      const safety = 0.96;
      const next = Math.min(1, (available / pageWidthPx) * safety);
      setIframeScale(next);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [isInIframe]);

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

      const t0 = performance.now();
      console.log("[PdfPreviewTiming] load start", { id, t0 });

      setLoading(true);
      setError(null);
      try {
        const tFetch0 = performance.now();
        const offerRes = await fetch(`/api/offers/${id}`, { cache: "no-store" });
        console.log("[PdfPreviewTiming] /api/offers fetch done", {
          ms: Math.round(performance.now() - tFetch0),
          ok: offerRes.ok,
          status: offerRes.status,
        });
        const offerJson = (await offerRes.json().catch(() => null)) as
          | { data?: OfferData; error?: string; message?: string }
          | null;

        if (!offerRes.ok) {
          setError(offerJson?.message ?? offerJson?.error ?? `Laden fehlgeschlagen (HTTP ${offerRes.status})`);
          return;
        }

        setData(offerJson?.data ?? null);

        // Layout is non-blocking: fetch in background
        void fetch("/api/settings/text-layout", { cache: "no-store" })
          .then((layoutRes) => layoutRes.json().catch(() => null).then((layoutJson) => ({ layoutRes, layoutJson })))
          .then(({ layoutRes, layoutJson }) => {
            if (!layoutRes.ok) return;
            setLayout((layoutJson as any)?.data ?? null);
          })
          .catch(() => null);
      } finally {
        setLoading(false);
        console.log("[PdfPreviewTiming] load end", { ms: Math.round(performance.now() - t0) });
      }
    }

    void load();
  }, [id]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const msg = e.data as any;
      if (!msg || msg.type !== "offerDraft" || !msg.payload) return;

      setData((prev) => {
        const p = msg.payload as Partial<OfferData>;
        const base: OfferData = prev ?? {
          id,
          title: typeof p.title === "string" ? p.title : "Angebot",
          offer_date: typeof (p as any).offer_date === "string" ? (p as any).offer_date : new Date().toISOString(),
          intro_salutation: typeof p.intro_salutation === "string" ? p.intro_salutation : null,
          intro_body_html: typeof p.intro_body_html === "string" ? p.intro_body_html : null,
          outro_body_html: typeof p.outro_body_html === "string" ? p.outro_body_html : null,
          tax_rate: typeof p.tax_rate === "number" ? p.tax_rate : null,
          customers: null,
          projects: null,
          groups: Array.isArray((p as any).groups) ? ((p as any).groups as any) : [],
        };
        return {
          ...base,
          ...p,
          groups: Array.isArray(p.groups) ? (p.groups as any) : base.groups,
        };
      });
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

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

  if (loading && !data) {
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
        <div
          ref={isInIframe ? iframeContainerRef : undefined}
          className={`${isInIframe ? 'w-full max-w-full space-y-6 py-6 px-4' : 'mx-auto max-w-[900px] space-y-8'}`}
        >
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

          const pageWidthMm = 210;
          const pageHeightMm = 297;
          const pxPerMm = 96 / 25.4;
          const pageWidthPx = pageWidthMm * pxPerMm;
          const pageHeightPx = pageHeightMm * pxPerMm;

          const pageOuterStyle = isInIframe
            ? ({
                width: "210mm",
                height: "297mm",
                transform: `scale(${iframeScale})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              } as const)
            : ({ width: "210mm", height: "297mm" } as const);

          const pageWrapperStyle = isInIframe
            ? ({
                width: `${pageWidthPx * iframeScale}px`,
                height: `${pageHeightPx * iframeScale}px`,
                marginLeft: "auto",
                marginRight: "auto",
                position: "relative",
              } as const)
            : undefined;

          return (
            <div key={pageIndex} className={isInIframe ? "w-full" : ""} style={pageWrapperStyle}>
              <div
                className={`${isInIframe ? 'border border-zinc-200 shadow-sm' : 'mx-auto rounded shadow'} bg-white`}
                style={pageOuterStyle}
              >
              <div
                className="flex h-full flex-col text-[12px] leading-[1.35] text-zinc-900"
                style={isInIframe 
                  ? { paddingLeft: "22mm", paddingRight: "18mm", paddingTop: "16mm", paddingBottom: "6mm" }
                  : { paddingLeft: "22mm", paddingRight: "18mm", paddingTop: "16mm", paddingBottom: "6mm" }
                }
              >
                <div>
                  <div className={`flex justify-between ${isFirst ? "items-start" : "items-center"}`}>
                    {isFirst ? (
                      <div className="min-w-0 flex-1" />
                    ) : (
                      <div
                        className="min-w-0 flex-1 text-[10px] text-zinc-700"
                        style={{ marginTop: "-6mm" }}
                      >
                        <div className="flex gap-2">
                          <div className="text-zinc-600">Angebotsdatum:</div>
                          <div className="text-zinc-900">{formatDateDE(data.offer_date)}</div>
                        </div>
                        <div className="flex gap-2">
                          <div className="text-zinc-600">Projektnummer:</div>
                          <div className="text-zinc-900">{data.project_number ?? ""}</div>
                        </div>
                        <div className="flex gap-2">
                          <div className="text-zinc-600">Angebotsnummer:</div>
                          <div className="text-zinc-900">{data.offer_number ?? data.id}</div>
                        </div>
                      </div>
                    )}
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

                  {isFirst ? (
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
                  ) : null}

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
                          <div style={{ whiteSpace: "pre-line" }}>
                            {data.intro_body_html
                              ? htmlToPlainTextPreserveLines(data.intro_body_html)
                              : "Herzlichen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen hiermit folgendes Angebot:"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="text-[14px] font-semibold">{data.title}</div>
                    </div>
                  )}
                </div>

                {!isLast ? (
                  <div className="flex-1 min-h-0 pt-4 flex flex-col">
                    <div className="flex-1 min-h-0">
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
                  </div>
                ) : (
                  <div className="pt-4">
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
                )}

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
                    <div style={{ whiteSpace: "pre-line" }}>
                      {htmlToPlainTextPreserveLines(data.outro_body_html)}
                    </div>
                  </div>
                ) : null}

                <div className="flex-1" style={{ minHeight: "6mm" }} />

                <div>
                  {!isLast ? (
                    <div className="flex justify-end">
                      <div className="w-[90mm] border-t border-zinc-300 pt-2">
                        <div className="flex items-baseline justify-between text-[11px]">
                          <div className="text-zinc-700">Zwischensumme</div>
                          <div className="font-semibold">{currencyEUR(runningSubtotalNet)}</div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {footerColumns ? (
                    <div className="border-t border-zinc-300 pt-2">
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
                    <div className="pt-2 text-right text-[10px] text-zinc-600">Seite {pageNo}/{pageCount}</div>
                  )}
                </div>
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}
