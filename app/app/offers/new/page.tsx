'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { OfferGroup, OfferItem } from "@/types/offer";
import { handleAddGroup, handleMoveGroup, handleDeleteGroup, handleDuplicateGroup } from "@/lib/offer-handlers";
import { handleAddItem, handleMoveItem, handleDuplicateItem, handleUpdateItem } from "@/lib/item-handlers";
import { calculateOfferTotals } from "@/lib/calculations";
import OfferSummary from "@/components/offers/OfferSummary";
import PaymentTerms from "@/components/offers/PaymentTerms";
import OutroText from "@/components/offers/OutroText";
import OfferGroupSection from "@/components/offers/OfferGroup";
import RichTextEditor from "@/components/ui/RichTextEditor";

const emptyItem: OfferItem = {
  id: "1",
  type: "material",
  position_index: "1",
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

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Array<{
    id: string;
    name: string;
    street: string;
    zip: string;
    city: string;
  }>>([]);
  const [projects, setProjects] = useState<Array<{
    id: string;
    title: string;
  }>>([]);
  const [customerId, setCustomerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("Angebot");
  const [offerDate, setOfferDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [introText, setIntroText] = useState(
    "Sehr geehrte Damen und Herren,\n\nHerzlichen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen hiermit folgendes Angebot:"
  );
  const [outroText, setOutroText] = useState(
    "Bitte beachten Sie, dass eventuell zusätzliche Kosten für unvorhergesehene Schäden oder zusätzliche Arbeiten anfallen können. Sollten während der Arbeiten unvorhergesehene Probleme auftreten, werden wir Sie umgehend informieren und mögliche Lösungen sowie die damit verbundenen Kosten mit Ihnen abstimmen.\n\nWir würden uns sehr freuen, wenn unser Angebot Ihre Zustimmung findet. Sie haben Fragen oder wünschen weitere Informationen? Rufen Sie uns an - wir sind für Sie da."
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
    "1": [{ ...emptyItem }],
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

  // Aktualisiere Berechnungen wenn sich Items ändern
  useEffect(() => {
    const { groups: updatedGroups } = calculateOfferTotals(groups, items);
    
    // Vergleiche die Werte, um einen Zyklus zu vermeiden
    const hasChanges = updatedGroups.some((group, index) => {
      const currentGroup = groups[index];
      if (!currentGroup) return true;

      return (
        group.material_cost !== currentGroup.material_cost ||
        group.labor_cost !== currentGroup.labor_cost ||
        group.other_cost !== currentGroup.other_cost ||
        group.material_margin !== currentGroup.material_margin ||
        group.labor_margin !== currentGroup.labor_margin ||
        group.other_margin !== currentGroup.other_margin ||
        group.total_net !== currentGroup.total_net
      );
    });

    if (hasChanges) {
      setGroups(updatedGroups);
    }
  }, [items]);

  // Gruppe hinzufügen
  function onAddGroup() {
    const newGroups = handleAddGroup(groups);
    setGroups(newGroups);
    
    // Füge automatisch eine leere Position zur neuen Gruppe hinzu
    const newGroupId = newGroups[newGroups.length - 1].id;
    setItems((prev) => ({
      ...prev,
      [newGroupId]: [{ ...emptyItem, id: Math.random().toString() }],
    }));
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

  function onDuplicateGroup(groupId: string) {
    const { groups: newGroups, items: newItems } = handleDuplicateGroup(
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

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Berechne aktuelle Summen
  const { material_cost, labor_cost, other_cost, material_margin, labor_margin, other_margin } = calculateOfferTotals(groups, items);

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
            <h2 className="text-base font-semibold text-zinc-800 mb-4">
              Kunde oder Projekt auswählen
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Kunde *
                </label>
                <div className="relative">
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-zinc-200 bg-white px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Bitte wählen...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
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
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Projekt
                </label>
                <div className="relative">
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-zinc-200 bg-white px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-50"
                    disabled={!customerId}
                  >
                    <option value="">Ohne Projekt</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
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
            </div>
          </div>

          {/* Anschrift */}
          {selectedCustomer && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="text-base font-semibold text-zinc-800 mb-4">Anschrift</h2>
              <div className="text-sm">
                <p>{selectedCustomer.name}</p>
                <p>{selectedCustomer.street}</p>
                <p>
                  {selectedCustomer.zip} {selectedCustomer.city}
                </p>
              </div>
            </div>
          )}

          {/* Angebotsdetails */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-semibold text-zinc-800 mb-4">Angebotsdetails</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Angebotstitel
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
              <h2 className="text-base font-semibold text-zinc-800">Einleitungstext</h2>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Vorlagen
              </button>
            </div>

            <RichTextEditor value={introText} onChange={setIntroText} rows={6} />
          </div>

          {/* Leistungen */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-semibold text-zinc-800">Leistungen</h2>
            </div>

            <div className="space-y-8">
              {groups.map((group) => (
                <OfferGroupSection
                  key={group.id}
                  group={group}
                  items={items[group.id] ?? []}
                  onDeleteGroup={() => onDeleteGroup(group.id)}
                  onDuplicateGroup={() => onDuplicateGroup(group.id)}
                  onUpdateGroup={(updatedGroup) =>
                    setGroups((prev) =>
                      prev.map((g) =>
                        g.id === updatedGroup.id ? updatedGroup : g
                      )
                    )
                  }
                  onAddItem={() => onAddItem(group.id)}
                  onUpdateItem={(item) => onUpdateItem(group.id, item)}
                  onDeleteItem={(itemId) => onDeleteItem(group.id, itemId)}
                  onMoveItem={(itemId, direction) =>
                    onMoveItem(group.id, itemId, direction)
                  }
                  onDuplicateItem={(itemId) =>
                    onDuplicateItem(group.id, itemId)
                  }
                />
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

          {/* Zusammenfassung */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <OfferSummary
              materialCost={material_cost}
              laborCost={labor_cost}
              otherCost={other_cost}
              materialMargin={material_margin}
              laborMargin={labor_margin}
              otherMargin={other_margin}
              taxRate={taxRate}
              showVatForLabor={showVatForLabor}
              onShowVatForLaborChange={setShowVatForLabor}
              onTaxRateChange={setTaxRate}
            />
          </div>

          {/* Zahlungsbedingungen */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <PaymentTerms
              paymentDueDays={paymentDueDays}
              discountPercent={discountPercent}
              discountDays={discountDays}
              onPaymentDueDaysChange={setPaymentDueDays}
              onDiscountPercentChange={setDiscountPercent}
              onDiscountDaysChange={setDiscountDays}
            />
          </div>

          {/* Schlusstext */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <OutroText
              outroBody={outroText}
              onOutroBodyChange={setOutroText}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
