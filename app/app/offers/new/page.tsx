"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Customer = {
  id: string;
  name: string;
  billing_street: string;
  billing_house_number: string;
  billing_address_extra: string | null;
  billing_postal_code: string;
  billing_city: string;
};

type Project = {
  id: string;
  title: string;
  project_number: string | null;
  status: string;
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
  type: "material" | "labor" | "other";
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

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
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
  const [groups, setGroups] = useState<OfferGroup[]>([
    {
      id: "1",
      index: 1,
      title: "Leistungen",
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
  const [paymentDueDays, setPaymentDueDays] = useState(7);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [discountDays, setDiscountDays] = useState<number | null>(null);
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
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der Kunden");
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

  // Position hinzufügen
  function handleAddItem(groupId: string) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const newItem: OfferItem = {
      id: Math.random().toString(),
      type: "material",
      position_index: `${(items[groupId]?.length ?? 0) + 1}`,
      name: "",
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

  // Position bearbeiten
  function handleUpdateItem(groupId: string, item: OfferItem) {
    setItems((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] ?? []).map((i) =>
        i.id === item.id ? item : i
      ),
    }));
  }

  // Position löschen
  function handleDeleteItem(groupId: string, itemId: string) {
    setItems((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] ?? []).filter((i) => i.id !== itemId),
    }));
  }

  // Gruppe hinzufügen
  function handleAddGroup() {
    const newGroup: OfferGroup = {
      id: Math.random().toString(),
      index: groups.length + 1,
      title: "Neue Gruppe",
      material_cost: 0,
      labor_cost: 0,
      other_cost: 0,
      material_margin: 0,
      labor_margin: 0,
      other_margin: 0,
      total_net: 0,
    };

    setGroups((prev) => [...prev, newGroup]);
    setItems((prev) => ({ ...prev, [newGroup.id]: [] }));
  }

  // Gruppe bearbeiten
  function handleUpdateGroup(group: OfferGroup) {
    setGroups((prev) =>
      prev.map((g) => (g.id === group.id ? group : g))
    );
  }

  // Gruppe löschen
  function handleDeleteGroup(groupId: string) {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setItems((prev) => {
      const { [groupId]: _, ...rest } = prev;
      return rest;
    });
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
          title: title || "Angebot",
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
          total_net: 0,
          total_tax: 0,
          total_gross: 0,
        })
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
    } finally {
      setLoading(false);
    }
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
                    {c.name}
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

          {/* Anschrift */}
          {selectedCustomer ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="text-base font-medium mb-4">Anschrift</h2>
              <div className="text-sm">
                <p>{selectedCustomer.name}</p>
                <p>
                  {selectedCustomer.billing_street}{" "}
                  {selectedCustomer.billing_house_number}
                </p>
                {selectedCustomer.billing_address_extra ? (
                  <p>{selectedCustomer.billing_address_extra}</p>
                ) : null}
                <p>
                  {selectedCustomer.billing_postal_code}{" "}
                  {selectedCustomer.billing_city}
                </p>
              </div>
            </div>
          ) : null}

          {/* Angebotsdetails */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-medium mb-4">Angebotsdetails</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Angebot"
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Datum
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
            <h2 className="text-base font-medium mb-4">Einleitungstext</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Anrede
                </label>
                <input
                  type="text"
                  value={introSalutation}
                  onChange={(e) => setIntroSalutation(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Text
                </label>
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
                        handleUpdateGroup({
                          ...group,
                          title: e.target.value,
                        })
                      }
                      className="text-base font-medium bg-transparent border-none p-0"
                    />

                    <button
                      type="button"
                      onClick={() => handleAddItem(group.id)}
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
                          <th className="py-2 px-4 font-medium text-left">Art</th>
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
                          <th className="py-2 pl-4 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(items[group.id] ?? []).map((item) => (
                          <tr key={item.id} className="border-b border-zinc-200">
                            <td className="py-2 pr-4">{item.position_index}</td>
                            <td className="py-2 px-4">
                              <select
                                value={item.type}
                                onChange={(e) =>
                                  handleUpdateItem(group.id, {
                                    ...item,
                                    type: e.target.value as any,
                                  })
                                }
                                className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                              >
                                <option value="material">Material</option>
                                <option value="labor">Arbeit</option>
                                <option value="other">Sonstiges</option>
                              </select>
                            </td>
                            <td className="py-2 px-4">
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) =>
                                    handleUpdateItem(group.id, {
                                      ...item,
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="Bezeichnung"
                                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                                />
                                <textarea
                                  value={item.description ?? ""}
                                  onChange={(e) =>
                                    handleUpdateItem(group.id, {
                                      ...item,
                                      description: e.target.value || null,
                                    })
                                  }
                                  placeholder="Beschreibung"
                                  rows={2}
                                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) =>
                                  handleUpdateItem(group.id, {
                                    ...item,
                                    qty: parseFloat(e.target.value),
                                  })
                                }
                                className="w-24 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-right"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) =>
                                  handleUpdateItem(group.id, {
                                    ...item,
                                    unit: e.target.value,
                                  })
                                }
                                className="w-24 rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="number"
                                value={item.purchase_price}
                                onChange={(e) =>
                                  handleUpdateItem(group.id, {
                                    ...item,
                                    purchase_price: parseFloat(e.target.value),
                                  })
                                }
                                className="w-24 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-right"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="number"
                                value={item.markup_percent}
                                onChange={(e) =>
                                  handleUpdateItem(group.id, {
                                    ...item,
                                    markup_percent: parseFloat(e.target.value),
                                  })
                                }
                                className="w-24 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-right"
                              />
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
                            <td className="py-2 pl-4">
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteItem(group.id, item.id)
                                }
                                className="text-zinc-400 hover:text-zinc-600"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td
                            colSpan={9}
                            className="py-2 px-4 text-right font-medium"
                          >
                            Zwischensumme
                          </td>
                          <td className="py-2 pl-4 text-right font-medium">
                            {group.total_net.toFixed(2)} €
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddGroup}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
              >
                Gruppe hinzufügen
              </button>
            </div>
          </div>

          {/* Zahlungsbedingungen */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-medium mb-4">Zahlungsbedingungen</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Zahlungsziel (Tage)
                </label>
                <input
                  type="number"
                  value={paymentDueDays}
                  onChange={(e) => setPaymentDueDays(parseInt(e.target.value))}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Skonto (%)
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Skonto-Tage
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
                />
              </div>
            </div>
          </div>

          {/* Schlusstext */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-medium mb-4">Schlusstext</h2>
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
