"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { OfferGroup, OfferItem } from "@/types/offer";
import { calculateOfferSummary } from "@/lib/calculations";

type Customer = {
  id: string;
  name: string;
  company_name: string | null;
  billing_street: string;
  billing_house_number: string;
  billing_postal_code: string;
  billing_city: string;
  billing_address_extra: string | null;
};

type Project = {
  id: string;
  title: string;
};

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [title, setTitle] = useState("Angebot");
  const [offerDate, setOfferDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [introSalutation, setIntroSalutation] = useState(
    "Sehr geehrte Damen und Herren,"
  );
  const [introBody, setIntroBody] = useState(
    "Herzlichen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen hiermit folgendes Angebot:"
  );
  const [outroBody, setOutroBody] = useState(
    "Bitte beachten Sie, dass eventuell zusätzliche Kosten für unvorhergesehene Schäden oder zusätzliche Arbeiten anfallen können. Sollten während der Arbeiten unvorhergesehene Probleme auftreten, werden wir Sie umgehend informieren und mögliche Lösungen sowie die damit verbundenen Kosten mit Ihnen abstimmen.\n\nWir würden uns sehr freuen, wenn unser Angebot Ihre Zustimmung findet. Sie haben Fragen oder wünschen weitere Informationen? Rufen Sie uns an - wir sind für Sie da."
  );
  const [paymentDueDays, setPaymentDueDays] = useState(7);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [discountDays, setDiscountDays] = useState<number | null>(null);
  const [groups, setGroups] = useState<OfferGroup[]>([
    {
      id: "1",
      index: 1,
      title: "Titel der Leistungsgruppe",
      material_cost: 0,
      labor_cost: 0,
      other_cost: 0,
      material_margin: 0,
      labor_margin: 0,
      other_margin: 0,
      total_net: 0,
    },
  ]);
  const [items, setItems] = useState<Record<string, OfferItem[]>>({
    "1": [],
  });
  const [taxRate, setTaxRate] = useState(19);
  const [showVatForLabor, setShowVatForLabor] = useState(false);

  // Lade Kunden
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch("/api/customers");
        if (!res.ok) throw new Error("Laden fehlgeschlagen");
        const json = await res.json();
        setCustomers(json.data ?? []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der Kunden");
        setLoading(false);
      }
    }

    void loadCustomers();
  }, []);

  // Lade Projekte wenn Kunde ausgewählt
  useEffect(() => {
    async function loadProjects() {
      if (!selectedCustomer) {
        setProjects([]);
        return;
      }

      try {
        const res = await fetch(`/api/customers/${selectedCustomer.id}/projects`);
        if (!res.ok) throw new Error("Laden fehlgeschlagen");
        const json = await res.json();
        setProjects(json.data ?? []);
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der Projekte");
      }
    }

    void loadProjects();
  }, [selectedCustomer]);

  // Kunde auswählen
  function handleCustomerChange(customerId: string) {
    const customer = customers.find((c) => c.id === customerId);
    setSelectedCustomer(customer ?? null);
    setSelectedProject(null);
  }

  // Projekt auswählen
  function handleProjectChange(projectId: string) {
    const project = projects.find((p) => p.id === projectId);
    setSelectedProject(project ?? null);
  }

  // Berechne Summen
  const summary = calculateOfferSummary(
    groups,
    items,
    taxRate,
    discountPercent,
    showVatForLabor
  );

  // Position hinzufügen
  function handleAddItem(groupId: string) {
    const newItem: OfferItem = {
      id: Math.random().toString(),
      type: "material",
      position_index: `${(items[groupId]?.length ?? 0) + 1}`,
      name: "Material hinzufügen",
      description: null,
      qty: 1,
      unit: "Stück",
      purchase_price: 0,
      markup_percent: 0,
      margin_amount: 0,
      unit_price: 0,
      line_total: 0,
    };

    setItems((prev) => ({
      ...prev,
      [groupId]: [...(prev[groupId] ?? []), newItem],
    }));
  }

  // Angebot erstellen
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) {
      setError("Bitte wählen Sie einen Kunden aus");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          project_id: selectedProject?.id,
          title,
          offer_date: offerDate,
          status: "draft",
          intro_salutation: introSalutation,
          intro_body_html: introBody,
          outro_body_html: outroBody,
          payment_due_days: paymentDueDays,
          discount_percent: discountPercent,
          discount_days: discountDays,
          tax_rate: taxRate,
          show_vat_for_labor: showVatForLabor,
          total_net: summary.totalNet,
          total_tax: summary.tax.total,
          total_gross: summary.totalGross,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const json = await res.json();
      router.push(`/app/offers/${json.data.id}`);
    } catch (err) {
      console.error(err);
      setError("Fehler beim Erstellen des Angebots");
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-4">Lädt...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/app/offers"
                className="text-zinc-400 hover:text-zinc-600"
              >
                ←
              </Link>
              <h1 className="text-lg font-medium">Angebot</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
              >
                Vorschau
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Wird erstellt..." : "Fertigstellen"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {/* Kunde & Projekt */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-medium mb-4">
              Kunde oder Projekt auswählen
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Kunde *
                </label>
                <select
                  value={selectedCustomer?.id ?? ""}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                  required
                >
                  <option value="">Bitte wählen...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name ?? c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Projekt
                </label>
                <select
                  value={selectedProject?.id ?? ""}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                  disabled={!selectedCustomer}
                >
                  <option value="">Ohne Projekt</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Anschrift */}
          {selectedCustomer && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="text-base font-medium mb-4">Anschrift</h2>
              <div className="text-sm">
                <p>{selectedCustomer.company_name ?? selectedCustomer.name}</p>
                <p>
                  {selectedCustomer.billing_street}{" "}
                  {selectedCustomer.billing_house_number}
                </p>
                {selectedCustomer.billing_address_extra && (
                  <p>{selectedCustomer.billing_address_extra}</p>
                )}
                <p>
                  {selectedCustomer.billing_postal_code}{" "}
                  {selectedCustomer.billing_city}
                </p>
              </div>
            </div>
          )}

          {/* Angebotsdetails */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-medium mb-4">Angebotsdetails</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Angebotstittel
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Angebotsdatum
                </label>
                <input
                  type="date"
                  value={offerDate}
                  onChange={(e) => setOfferDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Einleitungstext */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium">Einleitungstext</h2>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Vorlagen
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={introSalutation}
                  onChange={(e) => setIntroSalutation(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>

              <div>
                <textarea
                  value={introBody}
                  onChange={(e) => setIntroBody(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Leistungen */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-medium mb-4">Leistungen</h2>

            {/* Gruppen */}
            <div className="space-y-8">
              {groups.map((group) => (
                <div key={group.id}>
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      value={group.title}
                      onChange={(e) =>
                        setGroups((prev) =>
                          prev.map((g) =>
                            g.id === group.id
                              ? { ...g, title: e.target.value }
                              : g
                          )
                        )
                      }
                      className="text-base font-medium bg-transparent border-none p-0"
                    />
                    <span className="text-sm text-zinc-600">
                      {group.total_net.toFixed(2)} €
                    </span>
                  </div>

                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => handleAddItem(group.id)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Position hinzufügen
                    </button>

                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Artikel importieren (DDS)
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
              >
                Leistungsgruppe hinzufügen
              </button>
            </div>

            {/* Summen */}
            <div className="mt-8 space-y-8 border-t border-zinc-200 pt-8">
              {/* Nettosumme */}
              <div>
                <h3 className="text-sm font-medium mb-2">Nettosumme</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Materialkosten</span>
                    <span>{summary.costs.material.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Lohnkosten</span>
                    <span>{summary.costs.labor.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Sonstige Kosten</span>
                    <span>{summary.costs.other.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Kosten gesamt</span>
                    <span>{summary.costs.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Margen */}
              <div>
                <h3 className="text-sm font-medium mb-2">Gesamtmarge</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Marge auf Materialkosten</span>
                    <span>{summary.margins.material.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Marge auf Lohnkosten</span>
                    <span>{summary.margins.labor.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">
                      Marge auf sonstige Kosten
                    </span>
                    <span>{summary.margins.other.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Marge gesamt</span>
                    <span>{summary.margins.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Rabatt */}
              <div>
                <button
                  type="button"
                  onClick={() => setDiscountPercent(0)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Rabatt hinzufügen
                </button>

                {discountPercent !== null && (
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={discountPercent}
                        onChange={(e) =>
                          setDiscountPercent(parseFloat(e.target.value))
                        }
                        className="w-20 rounded-lg border border-zinc-200 px-2 py-1 text-right"
                      />
                      <span>%</span>
                      <span className="text-zinc-600">
                        ({summary.discount.amount.toFixed(2)} €)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Steuer */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                  >
                    <option value="19">19% Umsatzsteuer</option>
                    <option value="7">7% Umsatzsteuer</option>
                    <option value="0">0% Umsatzsteuer</option>
                  </select>
                  <span className="text-sm">
                    {summary.tax.total.toFixed(2)} €
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showVatForLabor}
                    onChange={(e) => setShowVatForLabor(e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                  <span className="text-sm">
                    Umsatzsteuer für Lohnkosten ausweisen
                  </span>
                </div>

                {showVatForLabor && (
                  <div className="text-sm text-zinc-600">
                    Im Bruttobetrag sind {summary.tax.laborOnly.net.toFixed(2)} €
                    (netto) Lohnkosten enthalten. Die darin enthaltene
                    Umsatzsteuer beträgt {summary.tax.laborOnly.tax.toFixed(2)} €.
                  </div>
                )}
              </div>

              {/* Gesamtbetrag */}
              <div className="flex justify-between items-center text-lg font-medium">
                <span>Gesamtbetrag</span>
                <span>{summary.totalGross.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Zahlungsbedingungen */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-medium mb-4">Zahlungsbedingungen</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Zahlungsziel
                </label>
                <select
                  value={paymentDueDays}
                  onChange={(e) => setPaymentDueDays(parseInt(e.target.value))}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                >
                  <option value="7">7 Tage</option>
                  <option value="14">14 Tage</option>
                  <option value="30">30 Tage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Skonto
                </label>
                <input
                  type="number"
                  value={discountPercent ?? ""}
                  onChange={(e) =>
                    setDiscountPercent(
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                  placeholder="0 %"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Zeitraum
                </label>
                <input
                  type="number"
                  value={discountDays ?? ""}
                  onChange={(e) =>
                    setDiscountDays(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                  placeholder="0 Tage"
                />
              </div>
            </div>

            <div className="mt-4 text-sm">
              Der fällige Betrag ist ohne Abzug zahlbar innerhalb von{" "}
              {paymentDueDays} Tagen ab Rechnungsdatum.
            </div>
          </div>

          {/* Schlusstext */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium">Schlusstext</h2>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Vorlagen
              </button>
            </div>

            <div>
              <textarea
                value={outroBody}
                onChange={(e) => setOutroBody(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
