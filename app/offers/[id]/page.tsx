"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerProjectSelect } from "@/components/offers/CustomerProjectSelect";
import { LineItemGroup } from "@/components/offers/LineItemGroup";
import { SummaryBox } from "@/components/offers/SummaryBox";
import { TemplateSelect } from "@/components/offers/TemplateSelect";
import { formatDate } from "@/lib/format";

export default function OfferEditorPage({
  params
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Daten laden
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/offers/${params.id}`);
      const json = await res.json();
      if (!res.ok) {
        setError("Laden fehlgeschlagen");
        return;
      }
      setData(json.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [params.id]);

  // Änderungen speichern
  async function save(changes: any) {
    const res = await fetch(`/api/offers/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes)
    });
    if (!res.ok) return;
    void load();
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-sm">Laden...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Angebot konnte nicht geladen werden"}
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
            <button
              type="button"
              onClick={() => router.push("/app/app/offers")}
              className="text-zinc-400 hover:text-zinc-600"
            >
              ←
            </button>

            <h1 className="text-xl font-semibold">Angebot</h1>

            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              {
                draft: "bg-zinc-100 text-zinc-800",
                sent: "bg-sky-100 text-sky-800",
                accepted: "bg-emerald-100 text-emerald-800",
                rejected: "bg-rose-100 text-rose-800"
              }[data.status as "draft" | "sent" | "accepted" | "rejected"]
            }`}>
              {
                {
                  draft: "Entwurf",
                  sent: "Versendet",
                  accepted: "Angenommen",
                  rejected: "Abgelehnt"
                }[data.status as "draft" | "sent" | "accepted" | "rejected"]
              }
            </span>
          </div>

          {/* Rechts: Aktionen */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                // TODO: Vorschau
              }}
              className="px-4 py-2 text-sm rounded-lg hover:bg-zinc-50"
            >
              Vorschau
            </button>

            <button
              type="button"
              onClick={() => {
                save({ status: "sent" });
              }}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Fertigstellen
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Linke Spalte */}
          <div className="col-span-8 space-y-6">
            {/* Kunde/Projekt */}
            <div className="rounded-xl border bg-white p-4 space-y-4">
              <h2 className="text-base font-medium">
                Kunde oder Projekt auswählen
              </h2>

              <div className="space-y-4">
                <CustomerProjectSelect
                  type="customer"
                  value={
                    data.customer
                      ? {
                          id: data.customer.id,
                          label:
                            data.customer.type === "company"
                              ? data.customer.company_name
                              : `${data.customer.salutation} ${data.customer.first_name} ${data.customer.last_name}`
                        }
                      : null
                  }
                  onChange={(value) => save({ customer_id: value?.id })}
                />

                <CustomerProjectSelect
                  type="project"
                  value={
                    data.project
                      ? {
                          id: data.project.id,
                          label: data.project.title
                        }
                      : null
                  }
                  customerId={data.customer?.id}
                  onChange={(value) => save({ project_id: value?.id })}
                />
              </div>
            </div>

            {/* Angebotsdetails */}
            <div className="rounded-xl border bg-white p-4 space-y-4">
              <h2 className="text-base font-medium">Angebotsdetails</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Angebotstitel
                  </label>
                  <input
                    type="text"
                    value={data.title}
                    onChange={(e) => save({ title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Angebotsdatum
                  </label>
                  <input
                    type="date"
                    value={data.offer_date}
                    onChange={(e) => save({ offer_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Einleitungstext */}
            <div className="rounded-xl border bg-white p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">Einleitungstext</h2>
                <TemplateSelect
                  type="intro"
                  onSelect={(template) =>
                    save({
                      intro_salutation: template.salutation,
                      intro_body_html: template.body_html
                    })
                  }
                />
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={data.intro_salutation ?? ""}
                  onChange={(e) =>
                    save({ intro_salutation: e.target.value })
                  }
                  placeholder="Sehr geehrte Damen und Herren,"
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />

                <textarea
                  value={data.intro_body_html ?? ""}
                  onChange={(e) =>
                    save({ intro_body_html: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 text-sm border rounded-lg resize-none"
                />
              </div>
            </div>

            {/* Leistungen */}
            <div className="space-y-4">
              {data.groups?.map((group: any) => (
                <LineItemGroup
                  key={group.id}
                  id={group.id}
                  index={group.index}
                  title={group.title}
                  items={group.offer_items}
                  totals={{
                    material_cost: group.material_cost,
                    labor_cost: group.labor_cost,
                    other_cost: group.other_cost,
                    material_margin: group.material_margin,
                    labor_margin: group.labor_margin,
                    other_margin: group.other_margin,
                    total_net: group.total_net
                  }}
                  onUpdateTitle={(title) =>
                    fetch(
                      `/api/offers/${params.id}/groups/${group.id}`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title })
                      }
                    ).then(() => load())
                  }
                  onAddItem={() =>
                    fetch(
                      `/api/offers/${params.id}/groups/${group.id}/items`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          type: "material",
                          name: "",
                          qty: 1,
                          unit: "piece",
                          purchase_price: 0,
                          markup_percent: 0
                        })
                      }
                    ).then(() => load())
                  }
                  onUpdateItem={(itemId, changes) =>
                    fetch(
                      `/api/offers/${params.id}/groups/${group.id}/items/${itemId}`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(changes)
                      }
                    ).then(() => load())
                  }
                  onDeleteItem={(itemId) =>
                    fetch(
                      `/api/offers/${params.id}/groups/${group.id}/items/${itemId}`,
                      {
                        method: "DELETE"
                      }
                    ).then(() => load())
                  }
                  onDelete={() =>
                    fetch(`/api/offers/${params.id}/groups/${group.id}`, {
                      method: "DELETE"
                    }).then(() => load())
                  }
                />
              ))}

              <button
                type="button"
                onClick={() =>
                  fetch(`/api/offers/${params.id}/groups`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: "Neue Gruppe"
                    })
                  }).then(() => load())
                }
                className="w-full px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 rounded-xl border border-dashed"
              >
                Leistungsgruppe hinzufügen
              </button>
            </div>

            {/* Schlusstext */}
            <div className="rounded-xl border bg-white p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">Schlusstext</h2>
                <TemplateSelect
                  type="outro"
                  onSelect={(template) =>
                    save({ outro_body_html: template.body_html })
                  }
                />
              </div>

              <textarea
                value={data.outro_body_html ?? ""}
                onChange={(e) => save({ outro_body_html: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 text-sm border rounded-lg resize-none"
              />
            </div>
          </div>

          {/* Rechte Spalte */}
          <div className="col-span-4">
            <SummaryBox
              totals={{
                material_cost: data.groups?.reduce(
                  (sum: number, g: any) => sum + g.material_cost,
                  0
                ),
                labor_cost: data.groups?.reduce(
                  (sum: number, g: any) => sum + g.labor_cost,
                  0
                ),
                other_cost: data.groups?.reduce(
                  (sum: number, g: any) => sum + g.other_cost,
                  0
                ),
                material_margin: data.groups?.reduce(
                  (sum: number, g: any) => sum + g.material_margin,
                  0
                ),
                labor_margin: data.groups?.reduce(
                  (sum: number, g: any) => sum + g.labor_margin,
                  0
                ),
                other_margin: data.groups?.reduce(
                  (sum: number, g: any) => sum + g.other_margin,
                  0
                ),
                total_net: data.total_net,
                total_tax: data.total_tax,
                total_gross: data.total_gross
              }}
              onAdjustMargins={() => {
                // TODO: Margen Dialog
              }}
              onAddDiscount={() => {
                // TODO: Rabatt Dialog
              }}
              taxRate={data.tax_rate}
              showLaborTax={data.show_vat_for_labor}
              onToggleLaborTax={() =>
                save({ show_vat_for_labor: !data.show_vat_for_labor })
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
