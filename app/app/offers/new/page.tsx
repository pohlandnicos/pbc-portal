"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { OfferGroup, OfferItem } from "@/types/offer";
import { handleAddGroup, handleMoveGroup, handleDeleteGroup } from "@/lib/offer-handlers";
import { handleAddItem, handleMoveItem, handleDuplicateItem, handleUpdateItem } from "@/lib/item-handlers";

type Customer = {
  id: string;
  name: string;
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
  const [customerId, setCustomerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("Angebot");
  const [offerDate, setOfferDate] = useState(
    new Date().toISOString().split("T")[0]
  );
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
      if (!customerId) {
        setProjects([]);
        return;
      }

      try {
        const res = await fetch(`/api/customers/${customerId}/projects`);
        if (!res.ok) throw new Error("Laden fehlgeschlagen");
        const json = await res.json();
        setProjects(json.data ?? []);
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der Projekte");
      }
    }

    void loadProjects();
  }, [customerId]);

  // Gruppe hinzufügen
  function onAddGroup() {
    setGroups((prev) => handleAddGroup(prev));
  }

  // Gruppe nach oben/unten verschieben
  function onMoveGroup(groupId: string, direction: "up" | "down") {
    setGroups((prev) => handleMoveGroup(prev, groupId, direction));
  }

  // Gruppe löschen
  function onDeleteGroup(groupId: string) {
    const { groups: newGroups, items: newItems } = handleDeleteGroup(
      groups,
      items,
      groupId
    );
    setGroups(newGroups);
    setItems(newItems);
  }

  // Position hinzufügen
  function onAddItem(groupId: string) {
    const newItem = handleAddItem(items[groupId] ?? [], groupId);
    setItems((prev) => ({
      ...prev,
      [groupId]: [...(prev[groupId] ?? []), newItem],
    }));
  }

  // Position nach oben/unten verschieben
  function onMoveItem(groupId: string, itemId: string, direction: "up" | "down") {
    setItems((prev) => ({
      ...prev,
      [groupId]: handleMoveItem(prev[groupId] ?? [], itemId, direction),
    }));
  }

  // Position duplizieren
  function onDuplicateItem(groupId: string, itemId: string) {
    setItems((prev) => ({
      ...prev,
      [groupId]: handleDuplicateItem(prev[groupId] ?? [], itemId),
    }));
  }

  // Position löschen
  function onDeleteItem(groupId: string, itemId: string) {
    setItems((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] ?? []).filter((i) => i.id !== itemId),
    }));
  }

  // Position aktualisieren
  function onUpdateItem(groupId: string, item: OfferItem) {
    setItems((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] ?? []).map((i) =>
        i.id === item.id ? handleUpdateItem(i, item) : i
      ),
    }));
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
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
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
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                  disabled={!customerId}
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

          {/* Leistungen */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-medium mb-4">Leistungen</h2>

            <div className="space-y-8">
              {groups.map((group) => (
                <div key={group.id}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-zinc-400 hover:text-zinc-600"
                      >
                        ▼
                      </button>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-zinc-600">
                          {group.index}.
                        </span>
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
                          placeholder="Titel der Leistungsgruppe"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-zinc-600">
                        {group.total_net.toFixed(2)} €
                      </span>
                      <button
                        type="button"
                        className="text-zinc-400 hover:text-zinc-600"
                        onClick={() => onDeleteGroup(group.id)}
                      >
                        ⋮
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200">
                          <th className="py-2 pr-4 font-medium text-left">Nr</th>
                          <th className="py-2 px-4 font-medium text-left">Art</th>
                          <th className="py-2 px-4 font-medium text-right">
                            Menge
                          </th>
                          <th className="py-2 px-4 font-medium text-left">
                            Einheit
                          </th>
                          <th className="py-2 px-4 font-medium text-left">
                            Bezeichnung
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
                                  onUpdateItem(group.id, {
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
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) =>
                                  onUpdateItem(group.id, {
                                    ...item,
                                    qty: parseFloat(e.target.value),
                                  })
                                }
                                min={0}
                                step={0.01}
                                className="w-24 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-right"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <select
                                value={item.unit}
                                onChange={(e) =>
                                  onUpdateItem(group.id, {
                                    ...item,
                                    unit: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                              >
                                <option value="Stück">Stück</option>
                                <option value="Stunde">Stunde</option>
                                <option value="Meter">Meter</option>
                                <option value="m²">m²</option>
                                <option value="m³">m³</option>
                                <option value="kg">kg</option>
                                <option value="Pauschal">Pauschal</option>
                              </select>
                            </td>
                            <td className="py-2 px-4">
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) =>
                                    onUpdateItem(group.id, {
                                      ...item,
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="Material hinzufügen"
                                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                                />
                                <textarea
                                  value={item.description ?? ""}
                                  onChange={(e) =>
                                    onUpdateItem(group.id, {
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
                                value={item.purchase_price}
                                onChange={(e) =>
                                  onUpdateItem(group.id, {
                                    ...item,
                                    purchase_price: parseFloat(e.target.value),
                                  })
                                }
                                min={0}
                                step={0.01}
                                className="w-24 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-right"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="number"
                                value={item.markup_percent}
                                onChange={(e) =>
                                  onUpdateItem(group.id, {
                                    ...item,
                                    markup_percent: parseFloat(e.target.value),
                                  })
                                }
                                min={0}
                                step={0.1}
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
                                className="text-sm text-zinc-600 hover:text-zinc-900"
                              >
                                Normalposition ▾
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={9} className="py-2 px-4 text-right font-medium">
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

                  <div className="mt-4 space-x-4">
                    <button
                      type="button"
                      onClick={() => onAddItem(group.id)}
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
                onClick={onAddGroup}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
              >
                Leistungsgruppe hinzufügen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
