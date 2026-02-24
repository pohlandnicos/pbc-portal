'use client';

import { useEffect, useMemo, useRef, useState } from "react";
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
import { CustomerCreateDialog } from "@/components/customers/CustomerCreateDialog";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Array<{
    id: string;
    type?: "private" | "company";
    salutation?: string;
    lastName?: string;
    name: string;
    addressExtra?: string;
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
  const [introSalutation, setIntroSalutation] = useState("Sehr geehrte Damen und Herren,");
  const [introSalutationEdited, setIntroSalutationEdited] = useState(false);
  const [introText, setIntroText] = useState(
    "Herzlichen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen hiermit folgendes Angebot:"
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

  async function syncGroupsAndItemsToOffer(offerId: string) {
    const localGroups = (groups ?? []).slice().sort((a, b) => a.index - b.index);
    if (localGroups.length === 0) return;

    const offerRes = await fetch(`/api/offers/${offerId}`, { cache: "no-store" });
    const offerJson = (await offerRes.json().catch(() => null)) as
      | { data?: { groups?: Array<{ id: string; index: number; title: string }> } | null; error?: string; message?: string }
      | null;

    if (!offerRes.ok) {
      const apiMessage =
        (typeof offerJson?.message === "string" && offerJson.message.length > 0
          ? offerJson.message
          : null) ??
        (typeof offerJson?.error === "string" && offerJson.error.length > 0 ? offerJson.error : null);
      throw new Error(apiMessage ?? `Angebot laden fehlgeschlagen (HTTP ${offerRes.status})`);
    }

    const existingGroups = (offerJson?.data?.groups ?? []).slice().sort((a, b) => a.index - b.index);
    if (existingGroups.length === 0) {
      throw new Error("Angebotsgruppen konnten nicht geladen werden");
    }

    const groupIdByLocalIndex = new Map<number, string>();

    // 1) Erste existierende Gruppe als Basis verwenden (wird beim Offer-Create automatisch erzeugt)
    const firstExisting = existingGroups[0];
    const firstLocal = localGroups[0];

    // Titel/Index angleichen
    if (firstLocal?.title && firstLocal.title !== firstExisting.title) {
      await fetch(`/api/offers/${offerId}/groups/${firstExisting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: firstLocal.title, index: 1 }),
      });
    }
    groupIdByLocalIndex.set(firstLocal.index, firstExisting.id);

    // 2) Weitere Gruppen anlegen
    for (let i = 1; i < localGroups.length; i++) {
      const g = localGroups[i];
      const createGroupRes = await fetch(`/api/offers/${offerId}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: g.title || "Leistungen" }),
      });

      const createGroupJson = (await createGroupRes.json().catch(() => null)) as
        | { data?: { id?: string } | null; error?: string; message?: string }
        | null;
      if (!createGroupRes.ok) {
        const apiMessage =
          (typeof createGroupJson?.message === "string" && createGroupJson.message.length > 0
            ? createGroupJson.message
            : null) ??
          (typeof createGroupJson?.error === "string" && createGroupJson.error.length > 0
            ? createGroupJson.error
            : null);
        throw new Error(apiMessage ?? `Gruppe anlegen fehlgeschlagen (HTTP ${createGroupRes.status})`);
      }

      const newGroupId = createGroupJson?.data?.id;
      if (!newGroupId) throw new Error("Gruppe anlegen fehlgeschlagen");

      // Index sauber setzen (API erstellt fortlaufend, wir setzen ihn explizit passend)
      await fetch(`/api/offers/${offerId}/groups/${newGroupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: g.index, title: g.title || "Leistungen" }),
      });

      groupIdByLocalIndex.set(g.index, newGroupId);
    }

    // 3) Items für jede Gruppe anlegen
    for (const g of localGroups) {
      const groupId = groupIdByLocalIndex.get(g.index);
      if (!groupId) continue;

      const groupItems = (items[g.id] ?? []).filter((it) => (it.name ?? "").trim().length > 0);
      for (const it of groupItems) {
        const itemRes = await fetch(`/api/offers/${offerId}/groups/${groupId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: it.type,
            name: it.name,
            description: it.description ?? undefined,
            qty: Number(it.qty ?? 0),
            unit: it.unit,
            purchase_price: Number(it.purchase_price ?? 0),
            markup_percent: Number(it.markup_percent ?? 0),
          }),
        });

        if (!itemRes.ok) {
          const json = (await itemRes.json().catch(() => null)) as
            | { error?: string; message?: string }
            | null;
          const apiMessage =
            (typeof json?.message === "string" && json.message.length > 0 ? json.message : null) ??
            (typeof json?.error === "string" && json.error.length > 0 ? json.error : null);
          throw new Error(apiMessage ?? `Position anlegen fehlgeschlagen (HTTP ${itemRes.status})`);
        }
      }
    }
  }

  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);

  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const customerBoxRef = useRef<HTMLDivElement | null>(null);

  const [projectOpen, setProjectOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const projectBoxRef = useRef<HTMLDivElement | null>(null);

  async function createDraftOffer() {
    if (!customerId) {
      setError("Bitte wähle einen Kunden aus");
      return null;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          customer_id: customerId,
          project_id: projectId || undefined,
          offer_date: offerDate,
          intro_salutation: introSalutation,
          intro_body_html: introText,
          outro_body_html: outroText,
          payment_due_days: paymentDueDays,
          discount_percent: discountPercent ?? undefined,
          discount_days: discountDays ?? undefined,
          tax_rate: taxRate,
          show_vat_for_labor: showVatForLabor,
        }),
      });

      const json = (await res.json().catch(() => null)) as
        | { data?: { id?: string } | null; error?: string; message?: string }
        | null;

      if (!res.ok) {
        const apiMessage =
          (typeof json?.message === "string" && json.message.length > 0
            ? json.message
            : null) ??
          (typeof json?.error === "string" && json.error.length > 0 ? json.error : null);
        setError(apiMessage ?? `Speichern fehlgeschlagen (HTTP ${res.status})`);
        return null;
      }

      const id = json?.data?.id;
      if (!id) {
        setError("Speichern fehlgeschlagen");
        return null;
      }

      return id;
    } finally {
      setSubmitting(false);
    }
  }

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

  // Lade Kunden
  useEffect(() => {
    void loadCustomers();
  }, []);

  // Lade Projekte wenn Kunde ausgewählt
  useEffect(() => {
    async function loadProjects() {
      if (!customerId) {
        setProjects([]);
        setProjectId("");
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

  useEffect(() => {
    function onDown(ev: MouseEvent) {
      const t = ev.target as Node | null;
      if (t && customerBoxRef.current && !customerBoxRef.current.contains(t)) {
        setCustomerOpen(false);
      }
      if (t && projectBoxRef.current && !projectBoxRef.current.contains(t)) {
        setProjectOpen(false);
      }
    }

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedProject = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (!selectedCustomer) return;
    if (introSalutationEdited) return;

    if (selectedCustomer.type === "private") {
      const base = selectedCustomer.salutation === "Frau" ? "Sehr geehrte" : "Sehr geehrter";
      const name = `${selectedCustomer.salutation || ""} ${selectedCustomer.lastName || ""}`
        .replace(/\s+/g, " ")
        .trim();
      setIntroSalutation(`${base} ${name},`.replace(/\s+/g, " ").trim());
      return;
    }

    setIntroSalutation("Sehr geehrte Damen und Herren,");
  }, [selectedCustomer?.id, selectedCustomer?.type, selectedCustomer?.salutation, selectedCustomer?.lastName, introSalutationEdited]);

  useEffect(() => {
    // Reset manual override whenever customer changes.
    setIntroSalutationEdited(false);
  }, [selectedCustomer?.id]);

  useEffect(() => {
    if (!customerOpen) {
      setCustomerSearch(selectedCustomer?.name ?? "");
    }
  }, [customerOpen, selectedCustomer?.name]);

  useEffect(() => {
    if (!projectOpen) {
      setProjectSearch(selectedProject?.title ?? "");
    }
  }, [projectOpen, selectedProject?.title]);

  const customerOptions = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const hay = `${c.name} ${c.street} ${c.zip} ${c.city}`.toLowerCase();
      return hay.includes(q);
    });
  }, [customers, customerSearch]);

  const projectOptions = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.title.toLowerCase().includes(q));
  }, [projects, projectSearch]);

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

  // Berechne aktuelle Summen
  const { material_cost, labor_cost, other_cost, material_margin, labor_margin, other_margin } = calculateOfferTotals(groups, items);

  return (
    <div className="min-h-screen bg-zinc-50">
      <CustomerCreateDialog
        open={createCustomerOpen}
        onOpenChange={setCreateCustomerOpen}
        onCreated={async (newId) => {
          await loadCustomers();
          if (newId) {
            setCustomerId(newId);
            setCustomerSearch(customers.find((c) => c.id === newId)?.name ?? "");
          }
          setCreateCustomerOpen(false);
        }}
        renderTrigger={() => null}
      />

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
                disabled={submitting}
                onClick={async () => {
                  const id = await createDraftOffer();
                  if (!id) return;
                  try {
                    await syncGroupsAndItemsToOffer(id);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Speichern der Positionen fehlgeschlagen");
                    return;
                  }
                  router.push(`/app/offers/${id}/pdf-preview`);
                }}
              >
                Vorschau
              </button>
              <button
                type="button"
                disabled={loading || submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Wird erstellt..." : "Fertigstellen"}
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
            <h2 className="mb-4 text-base font-semibold text-zinc-800">Kunde oder Projekt auswählen</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Kunde *</label>
                <div ref={customerBoxRef} className="relative">
                  <div className="relative">
                    <input
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setCustomerOpen(true);
                      }}
                      onFocus={() => setCustomerOpen(true)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Kunden auswählen"
                    />
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

                  {customerOpen ? (
                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                      <div className="max-h-64 overflow-auto py-1">
                        {customerOptions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-zinc-600">Keine Treffer</div>
                        ) : (
                          customerOptions.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="w-full px-3 py-2 text-left hover:bg-zinc-50"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setCustomerId(c.id);
                                setCustomerSearch(c.name);
                                setCustomerOpen(false);
                              }}
                            >
                              <div className="text-sm text-zinc-900">{c.name}</div>
                              <div className="text-xs text-zinc-600">
                                {c.street}, {c.zip} {c.city}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      <div className="border-t border-zinc-200 bg-white px-3 py-2">
                        <button
                          type="button"
                          className="w-full text-left text-sm text-blue-600 hover:text-blue-700"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCustomerOpen(false);
                            setCreateCustomerOpen(true);
                          }}
                        >
                          + Kunden anlegen
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Projekt</label>
                <div ref={projectBoxRef} className="relative">
                  <div className="relative">
                    <input
                      value={projectSearch}
                      onChange={(e) => {
                        setProjectSearch(e.target.value);
                        setProjectOpen(true);
                      }}
                      onFocus={() => {
                        if (customerId) setProjectOpen(true);
                      }}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-50"
                      placeholder="Projekt auswählen (optional)"
                      disabled={!customerId}
                    />
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

                  {projectOpen && customerId ? (
                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                      <div className="max-h-64 overflow-auto py-1">
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-zinc-50"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setProjectId("");
                            setProjectSearch("");
                            setProjectOpen(false);
                          }}
                        >
                          <div className="text-sm text-zinc-900">Ohne Projekt</div>
                        </button>
                        {projectOptions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-zinc-600">Keine Treffer</div>
                        ) : (
                          projectOptions.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full px-3 py-2 text-left hover:bg-zinc-50"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setProjectId(p.id);
                                setProjectSearch(p.title);
                                setProjectOpen(false);
                              }}
                            >
                              <div className="text-sm text-zinc-900">{p.title}</div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Anschrift */}
            <div className="mt-6">
              <h2 className="mb-2 text-base font-semibold text-zinc-800">Anschrift</h2>
              {selectedCustomer ? (
                <div className="text-sm">
                  <p>{selectedCustomer.name}</p>
                  {selectedCustomer.addressExtra ? <p>{selectedCustomer.addressExtra}</p> : null}
                  <p>{selectedCustomer.street}</p>
                  <p>
                    {selectedCustomer.zip} {selectedCustomer.city}
                  </p>
                </div>
              ) : (
                <div className="text-sm text-zinc-500">Bitte wähle zunächst einen Kunden oder ein Projekt aus.</div>
              )}
            </div>

            {/* Angebotsdetails */}
            <div className="mt-6">
              <h2 className="mb-4 text-base font-semibold text-zinc-800">Angebotsdetails</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Angebotstitel</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Angebotsdatum</label>
                  <input
                    type="date"
                    value={offerDate}
                    onChange={(e) => setOfferDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Einleitungstext */}
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-zinc-800">Einleitungstext</h2>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700">
                  Vorlagen
                </button>
              </div>

              <input
                type="text"
                value={introSalutation}
                onChange={(e) => {
                  setIntroSalutationEdited(true);
                  setIntroSalutation(e.target.value);
                }}
                className="mb-2 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <RichTextEditor value={introText} onChange={setIntroText} rows={6} />
            </div>
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
