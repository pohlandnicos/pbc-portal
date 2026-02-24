"use client";

import { useEffect, useMemo, useState } from "react";
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
  customers: OfferCustomer | null;
  projects: OfferProject | null;
  groups: OfferGroup[];
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

export default function OfferPdfPreviewPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OfferData | null>(null);

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
        const res = await fetch(`/api/offers/${id}`, { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as
          | { data?: OfferData; error?: string; message?: string }
          | null;
        if (!res.ok) {
          setError(json?.message ?? json?.error ?? `Laden fehlgeschlagen (HTTP ${res.status})`);
          return;
        }
        setData(json?.data ?? null);
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

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-8">
      <div className="mx-auto mb-4 flex max-w-[900px] items-center justify-between">
        <Link href={`/app/offers/${id}`} className="text-sm text-zinc-600 hover:text-zinc-800">
          ← Zurück
        </Link>
        <div className="text-sm text-zinc-600">Vorschau</div>
      </div>

      <div className="mx-auto max-w-[900px]">
        <div className="mx-auto w-[794px] rounded bg-white shadow">
          <div className="px-[56px] pb-[56px] pt-[56px] text-[12px] leading-[1.35] text-zinc-900">
            <div className="flex items-start justify-between">
              <div className="text-[10px] text-zinc-600">
                Bausanierung Plus GmbH · Neuhauser Str. 37A · 70599 Stuttgart
              </div>
              <div className="text-right text-[16px] font-semibold leading-tight">
                <div>Bausanierung</div>
                <div>Plus</div>
              </div>
            </div>

            <div className="mt-6 flex items-start justify-between gap-10">
              <div className="min-w-0 flex-1">
                {recipientLines.map((l, idx) => (
                  <div key={idx} className="truncate">
                    {l}
                  </div>
                ))}
              </div>
              <div className="w-[260px] text-right">
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

            <div className="mt-10">
              <div className="text-[22px] font-semibold">{data.title}</div>
              {executionLocation ? (
                <div className="mt-2 text-[11px] text-zinc-700">
                  Ausführungsort: {executionLocation}
                </div>
              ) : null}
            </div>

            <div className="mt-8 text-[12px]">
              <div className="font-normal">{data.intro_salutation ?? "Sehr geehrte Damen und Herren,"}</div>
              <div className="mt-1 text-zinc-800">
                {data.intro_body_html
                  ? data.intro_body_html.replace(/<[^>]*>/g, "").trim()
                  : "Herzlichen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen hiermit folgendes Angebot:"}
              </div>
            </div>

            <div className="mt-8">
              {(data.groups ?? [])
                .slice()
                .sort((a, b) => a.index - b.index)
                .map((g) => (
                  <div key={g.id} className="mt-6">
                    <div className="mb-2 text-[12px] font-semibold">{g.title}</div>
                    <div className="border-b border-zinc-300 pb-1">
                      <div className="grid grid-cols-[52px_1fr_64px_60px_90px_90px] gap-3 text-[10px] text-zinc-600">
                        <div>Nr.</div>
                        <div>Bezeichnung</div>
                        <div className="text-right">Menge</div>
                        <div>Einheit</div>
                        <div className="text-right">Einzelpreis</div>
                        <div className="text-right">Gesamtpreis</div>
                      </div>
                    </div>

                    <div>
                      {(g.offer_items ?? []).map((it) => (
                        <div key={it.id} className="border-b border-zinc-200 py-3">
                          <div className="grid grid-cols-[52px_1fr_64px_60px_90px_90px] gap-3">
                            <div className="text-[10px] text-zinc-600">{it.position_index}</div>
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

            <div className="mt-10 border-t border-zinc-300 pt-4">
              <div className="grid grid-cols-3 gap-6 text-[10px]">
                <div>
                  <div className="mb-2 font-semibold">Anschrift</div>
                  <div>Bausanierung Plus GmbH</div>
                  <div>Neuhauser Str. 37A</div>
                  <div>70599 Stuttgart</div>
                </div>
                <div>
                  <div className="mb-2 font-semibold">Bankverbindung</div>
                  <div>Bausanierung Plus GmbH</div>
                  <div>Volksbank Bietigheim-Bissingen eG</div>
                  <div>DE00 0000 0000 0000 0000 00</div>
                  <div>GENODE51BIA</div>
                </div>
                <div>
                  <div className="mb-2 font-semibold">Kontakt</div>
                  <div>www.bausanierung-plus.de · service@bausanierung-plus.de</div>
                  <div>+49 711 25296810</div>
                  <div>Bausanierung Plus GmbH · Cem Tuncay</div>
                </div>
              </div>

              <div className="mt-4 text-right text-[10px] text-zinc-700">{(data.offer_number ?? "") || data.id} · 1/1</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
