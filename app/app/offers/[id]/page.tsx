"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type Offer = {
  id: string;
  customer_id: string;
  project_id: string | null;
  title: string;
  offer_date: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "cancelled";
  intro_salutation: string | null;
  intro_body_html: string | null;
  outro_body_html: string | null;
  payment_due_days: number;
  discount_percent: number | null;
  discount_days: number | null;
  tax_rate: number;
  show_vat_for_labor: boolean;
  total_net: number;
  total_tax: number;
  total_gross: number;
};

type OfferGroup = {
  id: string;
  index: number;
  title: string;
  material_cost: number;
  labor_cost: number;
  other_cost: number;
  material_margin: number;
  labor_margin: number;
  other_margin: number;
  total_net: number;
};

type OfferItem = {
  id: string;
  offer_group_id: string;
  type: "material" | "labor" | "mixed" | "other";
  position_index: string;
  name: string;
  description: string | null;
  qty: number;
  unit: string;
  purchase_price: number;
  markup_percent: number;
  margin_amount: number;
  unit_price: number;
  line_total: number;
};

type Template = {
  id: string;
  type: "intro" | "outro";
  name: string;
  salutation: string | null;
  body_html: string;
  is_default: boolean;
};

export default function OfferPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [groups, setGroups] = useState<OfferGroup[]>([]);
  const [items, setItems] = useState<Record<string, OfferItem[]>>({});
  const [templates, setTemplates] = useState<Template[]>([]);

  // Lade Angebot und Gruppen
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Angebot laden
        const { data: offer, error: offerError } = await supabase
          .from("offers")
          .select()
          .eq("id", params.id)
          .single();

        if (offerError) throw offerError;
        if (!offer) throw new Error("Angebot nicht gefunden");

        setOffer({
          ...(offer as Offer),
          title: ((offer as any)?.name ?? (offer as any)?.title ?? "").toString(),
        });

        // Gruppen laden
        const { data: groups, error: groupsError } = await supabase
          .from("offer_groups")
          .select()
          .eq("offer_id", params.id)
          .order("index");

        if (groupsError) throw groupsError;
        setGroups(groups as OfferGroup[]);

        // Positionen laden
        const { data: items, error: itemsError } = await supabase
          .from("offer_items")
          .select()
          .in(
            "offer_group_id",
            (groups as OfferGroup[]).map((g) => g.id)
          )
          .order("position_index");

        if (itemsError) throw itemsError;

        // Positionen nach Gruppen gruppieren
        const itemsByGroup: Record<string, OfferItem[]> = {};
        for (const item of items as OfferItem[]) {
          if (!itemsByGroup[item.offer_group_id]) {
            itemsByGroup[item.offer_group_id] = [];
          }
          itemsByGroup[item.offer_group_id].push(item);
        }
        setItems(itemsByGroup);

        // Textvorlagen laden
        const { data: templates, error: templatesError } = await supabase
          .from("offer_templates")
          .select();

        if (templatesError) throw templatesError;
        setTemplates(templates as Template[]);
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [supabase, params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h1 className="text-lg font-medium mb-4">Angebot wird geladen...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h1 className="text-lg font-medium mb-4">Fehler</h1>
            <p className="text-sm text-zinc-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Links: Titel + Status */}
          <div className="flex items-center gap-4">
            <Link href="/app/offers" className="text-zinc-400 hover:text-zinc-600">
              ←
            </Link>

            <h1 className="text-xl font-semibold">{offer.title}</h1>

            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                {
                  draft: "bg-zinc-100 text-zinc-800",
                  sent: "bg-blue-100 text-blue-800",
                  accepted: "bg-green-100 text-green-800",
                  rejected: "bg-red-100 text-red-800",
                  cancelled: "bg-zinc-100 text-zinc-800",
                }[offer.status]
              }`}
            >
              {{
                draft: "Entwurf",
                sent: "Gesendet",
                accepted: "Angenommen",
                rejected: "Abgelehnt",
                cancelled: "Storniert",
              }[offer.status]}
            </span>
          </div>

          {/* Rechts: Actions */}
          <div className="flex items-center gap-2">
            <Link
              href={`/app/offers/${offer.id}/pdf-preview`}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
            >
              PDF
            </Link>

            {offer.status === "draft" ? (
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Senden
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Kunde & Projekt */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-medium mb-4">Kunde & Projekt</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Kunde
                </label>
                <select
                  value={offer.customer_id}
                  onChange={() => {}}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                >
                  <option value={offer.customer_id}>
                    {/* TODO: Kundenname laden */}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Projekt
                </label>
                <select
                  value={offer.project_id ?? ""}
                  onChange={() => {}}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                >
                  <option value="">Ohne Projekt</option>
                  {/* TODO: Projekte laden */}
                </select>
              </div>
            </div>
          </div>

          {/* Angebotsdaten */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-medium mb-4">Angebotsdaten</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  value={offer.title}
                  onChange={() => {}}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  value={offer.offer_date}
                  onChange={() => {}}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Einleitungstext */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-medium mb-4">Einleitungstext</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Vorlage
                </label>
                <select
                  value=""
                  onChange={() => {}}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                >
                  <option value="">Benutzerdefiniert</option>
                  {templates
                    .filter((t) => t.type === "intro")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Anrede
                </label>
                <input
                  type="text"
                  value={offer.intro_salutation ?? ""}
                  onChange={() => {}}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Text
                </label>
                <textarea
                  value={offer.intro_body_html ?? ""}
                  onChange={() => {}}
                  rows={4}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Leistungen */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-medium mb-4">Leistungen</h2>

            {/* Gruppen */}
            <div className="space-y-8">
              {groups.map((group) => (
                <div key={group.id}>
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      value={group.title}
                      onChange={() => {}}
                      className="text-base font-medium bg-transparent border-none p-0"
                    />

                    <button
                      type="button"
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
                    >
                      Position hinzufügen
                    </button>
                  </div>

                  {/* Positionen */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200">
                          <th className="py-2 pr-4 font-medium text-left">Pos</th>
                          <th className="py-2 px-4 font-medium text-left">
                            Bezeichnung
                          </th>
                          <th className="py-2 px-4 font-medium text-right">
                            Menge
                          </th>
                          <th className="py-2 px-4 font-medium text-left">
                            Einheit
                          </th>
                          <th className="py-2 px-4 font-medium text-right">
                            EK
                          </th>
                          <th className="py-2 px-4 font-medium text-right">
                            Aufschlag
                          </th>
                          <th className="py-2 px-4 font-medium text-right">
                            Marge
                          </th>
                          <th className="py-2 px-4 font-medium text-right">
                            EP
                          </th>
                          <th className="py-2 pl-4 font-medium text-right">
                            Gesamt
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(items[group.id] ?? []).map((item) => (
                          <tr key={item.id} className="border-b border-zinc-200">
                            <td className="py-2 pr-4">{item.position_index}</td>
                            <td className="py-2 px-4">
                              <div>{item.name}</div>
                              {item.description ? (
                                <div className="text-zinc-500">
                                  {item.description}
                                </div>
                              ) : null}
                            </td>
                            <td className="py-2 px-4 text-right">{item.qty}</td>
                            <td className="py-2 px-4">{item.unit}</td>
                            <td className="py-2 px-4 text-right">
                              {item.purchase_price.toFixed(2)} €
                            </td>
                            <td className="py-2 px-4 text-right">
                              {item.markup_percent.toFixed(0)} %
                            </td>
                            <td className="py-2 px-4 text-right">
                              {item.margin_amount.toFixed(2)} €
                            </td>
                            <td className="py-2 px-4 text-right">
                              {item.unit_price.toFixed(2)} €
                            </td>
                            <td className="py-2 pl-4 text-right">
                              {item.line_total.toFixed(2)} €
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td
                            colSpan={8}
                            className="py-2 px-4 text-right font-medium"
                          >
                            Zwischensumme
                          </td>
                          <td className="py-2 pl-4 text-right font-medium">
                            {group.total_net.toFixed(2)} €
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
              >
                Gruppe hinzufügen
              </button>
            </div>
          </div>

          {/* Abschlusstext */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-medium mb-4">Abschlusstext</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Vorlage
                </label>
                <select
                  value=""
                  onChange={() => {}}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                >
                  <option value="">Benutzerdefiniert</option>
                  {templates
                    .filter((t) => t.type === "outro")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Text
                </label>
                <textarea
                  value={offer.outro_body_html ?? ""}
                  onChange={() => {}}
                  rows={4}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Zahlungsbedingungen */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-medium mb-4">Zahlungsbedingungen</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Zahlungsziel (Tage)
                </label>
                <input
                  type="number"
                  value={offer.payment_due_days}
                  onChange={() => {}}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Skonto (%)
                </label>
                <input
                  type="number"
                  value={offer.discount_percent ?? ""}
                  onChange={() => {}}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Skonto-Tage
                </label>
                <input
                  type="number"
                  value={offer.discount_days ?? ""}
                  onChange={() => {}}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Summen */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-medium mb-4">Summen</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Steuersatz (%)
                  </label>
                  <input
                    type="number"
                    value={offer.tax_rate}
                    onChange={() => {}}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={offer.show_vat_for_labor}
                      onChange={() => {}}
                      className="rounded border-zinc-300"
                    />
                    <span className="text-sm text-zinc-700">
                      MwSt. auf Arbeitsleistung separat ausweisen
                    </span>
                  </label>
                </div>
              </div>

              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-2">Netto</td>
                    <td className="py-2 text-right">{offer.total_net} €</td>
                  </tr>
                  <tr>
                    <td className="py-2">MwSt. ({offer.tax_rate}%)</td>
                    <td className="py-2 text-right">{offer.total_tax} €</td>
                  </tr>
                  <tr className="font-medium">
                    <td className="py-2">Gesamt</td>
                    <td className="py-2 text-right">{offer.total_gross} €</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
