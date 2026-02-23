
'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import type { OfferGroup, OfferItem } from "@/types/offer";

type Props = {
  group: OfferGroup;
  items: OfferItem[];
  onDeleteGroup: () => void;
  onDuplicateGroup: () => void;
  onUpdateGroup: (group: OfferGroup) => void;
  onAddItem: () => void;
  onUpdateItem: (item: OfferItem) => void;
  onDeleteItem: (itemId: string) => void;
  onMoveItem: (itemId: string, direction: "up" | "down") => void;
  onDuplicateItem: (itemId: string) => void;
};

export default function OfferGroupSection({
  group,
  items,
  onDeleteGroup,
  onDuplicateGroup,
  onUpdateGroup,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onMoveItem,
  onDuplicateItem,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [itemTypeMenuFor, setItemTypeMenuFor] = useState<string | null>(null);
  const [positionTypeMenuFor, setPositionTypeMenuFor] = useState<string | null>(null);
  const [positionTypeById, setPositionTypeById] = useState<Record<string, "normal" | "alternative" | "demand">>({});
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const draggingItemIdRef = useRef<string | null>(null);
  const dragStartIndexRef = useRef<number | null>(null);

  function computeDropIndex(clientY: number) {
    const positioned = items
      .map((it, idx) => {
        const el = itemRefs.current[it.id];
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { id: it.id, idx, top: r.top, mid: r.top + r.height / 2 };
      })
      .filter(Boolean) as Array<{ id: string; idx: number; top: number; mid: number }>;

    if (positioned.length === 0) return null;

    let target = positioned[positioned.length - 1].idx;
    for (const p of positioned) {
      if (clientY < p.mid) {
        target = p.idx;
        break;
      }
    }
    return target;
  }

  function moveItemStepwise(itemId: string, direction: "up" | "down", steps: number) {
    if (steps <= 0) {
      setDraggingItemId(null);
      draggingItemIdRef.current = null;
      return;
    }

    onMoveItem(itemId, direction);
    window.setTimeout(() => moveItemStepwise(itemId, direction, steps - 1), 0);
  }

  useEffect(() => {
    function onDocumentClick(e: MouseEvent) {
      const target = e.target;
      if (target && rootRef.current && rootRef.current.contains(target as Node)) {
        return;
      }

      setMenuOpen(false);
      setItemTypeMenuFor(null);
      setPositionTypeMenuFor(null);
    }

    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, []);

  const gridTemplateColumns = useMemo(
    () => "56px 120px 60px 100px 1fr 80px 80px 80px 80px 80px",
    []
  );

  return (
    <div ref={rootRef} className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-zinc-400 hover:text-zinc-600"
          >
            {expanded ? "▼" : "▶"}
          </button>
          <div className="flex items-center gap-1">
            <span className="text-base font-semibold text-zinc-800">{group.index}.</span>
            <input
              type="text"
              value={group.title}
              onChange={(e) => onUpdateGroup({ ...group, title: e.target.value })}
              className="text-base font-semibold bg-transparent border-none p-0 focus:ring-0 text-zinc-800"
              placeholder="Titel der Leistungsgruppe"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600">{group.total_net.toFixed(2)} €</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-zinc-400 hover:text-zinc-600"
              aria-label="Gruppenaktionen"
            >
              ⋮
            </button>

            {menuOpen && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute right-0 top-6 z-20 w-40 rounded-md border border-zinc-200 bg-white shadow-sm"
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicateGroup();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                  role="menuitem"
                >
                  Duplizieren
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteGroup();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-zinc-50"
                  role="menuitem"
                >
                  Entfernen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div>
          {items.map((item) => (
            <div
              key={item.id}
              className="mb-6"
              ref={(el) => {
                itemRefs.current[item.id] = el;
              }}
            >
              <div
                className="grid gap-0 mb-1 text-xs text-zinc-500"
                style={{ gridTemplateColumns }}
              >
                <div className="px-2 text-left">Nr</div>
                <div className="px-2 text-left">Art</div>
                <div className="px-2 text-left">Menge</div>
                <div className="px-2 text-left">Einheit</div>
                <div className="px-2 text-left">Bezeichnung</div>
                <div className="px-2 text-left">Einkaufspreis</div>
                <div className="px-2 text-left">Aufschlag</div>
                <div className="px-2 text-left">Marge</div>
                <div className="px-2 text-left">Einzelpreis</div>
                <div className="px-2 text-left">Gesamtpreis</div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="grid gap-0 rounded-md border border-zinc-200 bg-zinc-50 overflow-visible flex-1"
                  style={{ gridTemplateColumns }}
                >
                  <div className="flex items-center gap-2 px-2 py-1 text-sm border-r border-zinc-200">
                    <div
                      role="button"
                      tabIndex={0}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        e.preventDefault();
                        setDraggingItemId(item.id);
                        draggingItemIdRef.current = item.id;
                        dragStartIndexRef.current = items.findIndex((i) => i.id === item.id);

                        const target = e.currentTarget as HTMLElement;
                        try {
                          target.setPointerCapture(e.pointerId);
                        } catch {
                          // ignore
                        }

                        const onMove = (_ev: PointerEvent) => {
                          if (!draggingItemIdRef.current) return;
                        };

                        const onUp = (ev: PointerEvent) => {
                          window.removeEventListener("pointermove", onMove);
                          window.removeEventListener("pointerup", onUp);

                          const draggedId = draggingItemIdRef.current;
                          const fromIndex = dragStartIndexRef.current;
                          const toIndex = computeDropIndex(ev.clientY);

                          setDraggingItemId(null);
                          draggingItemIdRef.current = null;
                          dragStartIndexRef.current = null;

                          if (!draggedId || fromIndex === null || toIndex === null || fromIndex === toIndex) {
                            return;
                          }

                          const direction: "up" | "down" = fromIndex > toIndex ? "up" : "down";
                          const steps = Math.abs(fromIndex - toIndex);
                          moveItemStepwise(draggedId, direction, steps);
                        };

                        window.addEventListener("pointermove", onMove);
                        window.addEventListener("pointerup", onUp);
                      }}
                      className="cursor-grab select-none text-zinc-400 hover:text-zinc-600 px-1 -mx-1"
                      aria-label="Position greifen"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <circle cx="9" cy="6" r="1.5" />
                        <circle cx="15" cy="6" r="1.5" />
                        <circle cx="9" cy="12" r="1.5" />
                        <circle cx="15" cy="12" r="1.5" />
                        <circle cx="9" cy="18" r="1.5" />
                        <circle cx="15" cy="18" r="1.5" />
                      </svg>
                    </div>
                    <span className="text-zinc-700">{item.position_index}</span>
                  </div>

                  <div className="flex items-center px-2 py-1 border-r border-zinc-200">
                    <div className="relative w-full">
                      <button
                        type="button"
                        onClick={() => setItemTypeMenuFor((v) => (v === item.id ? null : item.id))}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full flex items-center justify-between gap-2 bg-transparent text-sm text-zinc-800 hover:text-zinc-900"
                        aria-label="Art auswählen"
                      >
                        <span className="flex items-center gap-2">
                          {item.type === "material" && (
                            <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                            </svg>
                          )}
                          {item.type === "labor" && (
                            <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="9" />
                              <path d="M12 7v5l3 2" />
                            </svg>
                          )}
                          {item.type === "mixed" && (
                            <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2l8 5-8 5-8-5 8-5z" />
                              <path d="M4 12l8 5 8-5" />
                              <path d="M4 17l8 5 8-5" />
                            </svg>
                          )}
                          {item.type === "other" && (
                            <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <path d="M14 2v6h6" />
                            </svg>
                          )}
                          <span>
                            {item.type === "material" && "Material"}
                            {item.type === "labor" && "Lohn"}
                            {item.type === "mixed" && "Mischposition"}
                            {item.type === "other" && "Sonstiges"}
                          </span>
                        </span>
                        <svg viewBox="0 0 20 20" className="h-4 w-4 text-zinc-500" fill="currentColor">
                          <path d="M5.5 7.5L10 12l4.5-4.5" />
                        </svg>
                      </button>

                      {itemTypeMenuFor === item.id && (
                        <div
                          onMouseDown={(e) => e.stopPropagation()}
                          className="absolute left-0 mt-2 w-56 rounded-md border border-zinc-200 bg-white shadow-sm z-20"
                        >
                          {([
                            { value: "material", label: "Material", icon: (
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                              </svg>
                            ) },
                            { value: "labor", label: "Lohn", icon: (
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 7v5l3 2" />
                              </svg>
                            ) },
                            { value: "mixed", label: "Mischposition", icon: (
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2l8 5-8 5-8-5 8-5z" />
                                <path d="M4 12l8 5 8-5" />
                                <path d="M4 17l8 5 8-5" />
                              </svg>
                            ) },
                            { value: "other", label: "Sonstiges", icon: (
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <path d="M14 2v6h6" />
                              </svg>
                            ) },
                          ] as const).map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                onUpdateItem({ ...item, type: opt.value as OfferItem["type"] });
                                setItemTypeMenuFor(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                            >
                              <span className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2 text-zinc-700">
                                  <span className="text-zinc-500">{opt.icon}</span>
                                  {opt.label}
                                </span>
                                {item.type === opt.value && (
                                  <svg viewBox="0 0 20 20" className="h-4 w-4 text-blue-600" fill="currentColor">
                                    <path d="M7.7 13.3L4.4 10l1.4-1.4 1.9 1.9 6.6-6.6L15.7 5l-8 8.3z" />
                                  </svg>
                                )}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-2 py-1 border-r border-zinc-200">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => onUpdateItem({ ...item, qty: Number(e.target.value) })}
                      min={0}
                      step={0.01}
                      className="w-full bg-transparent text-right border-none text-sm p-0 appearance-none shadow-none focus:outline-none focus:ring-0"
                    />
                  </div>

                  <div className="px-2 py-1 border-r border-zinc-200">
                    <select
                      value={item.unit}
                      onChange={(e) => onUpdateItem({ ...item, unit: e.target.value })}
                      className="w-full bg-transparent border-none text-sm p-0 appearance-none shadow-none focus:outline-none focus:ring-0"
                    >
                      <option value="Stück">Stück</option>
                      <option value="Stunde">Stunde</option>
                      <option value="Meter">Meter</option>
                      <option value="m²">m²</option>
                      <option value="m³">m³</option>
                      <option value="kg">kg</option>
                      <option value="Pauschal">Pauschal</option>
                    </select>
                  </div>

                  <div className="px-2 py-1 border-r border-zinc-200">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => onUpdateItem({ ...item, name: e.target.value })}
                      placeholder="Material hinzufügen"
                      className="w-full bg-transparent border-none text-sm p-0 appearance-none shadow-none focus:outline-none focus:ring-0"
                    />
                  </div>

                  <div className="px-2 py-1 border-r border-zinc-200">
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        value={item.purchase_price}
                        onChange={(e) =>
                          onUpdateItem({ ...item, purchase_price: Number(e.target.value) })
                        }
                        min={0}
                        step={0.01}
                        className="w-full bg-transparent text-right border-none text-sm p-0 appearance-none shadow-none focus:outline-none focus:ring-0"
                      />
                      <span className="text-zinc-400 text-sm">€</span>
                    </div>
                  </div>

                  <div className="px-2 py-1 border-r border-zinc-200">
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        value={item.markup_percent}
                        onChange={(e) =>
                          onUpdateItem({ ...item, markup_percent: Number(e.target.value) })
                        }
                        min={0}
                        step={0.1}
                        className="w-full bg-transparent text-right border-none text-sm p-0 appearance-none shadow-none focus:outline-none focus:ring-0"
                      />
                      <span className="text-zinc-400 text-sm">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end px-2 py-1 text-sm border-r border-zinc-200">
                    {item.margin_amount.toFixed(2)} €
                  </div>
                  <div className="flex items-center justify-end px-2 py-1 text-sm border-r border-zinc-200">
                    {item.unit_price.toFixed(2)} €
                  </div>
                  <div className="flex items-center justify-end px-2 py-1 text-sm">
                    {item.line_total.toFixed(2)} €
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPendingDeleteItemId(item.id)}
                  className="text-zinc-400/70 hover:text-zinc-700"
                  aria-label="Position löschen"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M6 6l1 16h10l1-16" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              </div>

              <div className="flex items-start gap-2 mt-2">
                <div className="grid gap-3 flex-1" style={{ gridTemplateColumns: "minmax(320px,640px) 96px 1fr" }}>
                  <textarea
                    value={item.description ?? ""}
                    onChange={(e) =>
                      onUpdateItem({
                        ...item,
                        description: e.target.value.length ? e.target.value : null,
                      })
                    }
                    placeholder="Beschreibung"
                    rows={3}
                    className="h-24 w-full border border-zinc-200 rounded-md text-sm p-2 focus:outline-none focus:ring-0 resize-none"
                  />
                  <button
                    type="button"
                    className="h-24 w-24 rounded-md border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
                    aria-label="Bild hinzufügen"
                  >
                    <svg
                      className="w-4 h-4 mx-auto"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>

                  <div className="flex items-start justify-end">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setPositionTypeMenuFor((v) => (v === item.id ? null : item.id))
                        }
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50"
                      >
                        {(positionTypeById[item.id] ?? "normal") === "normal" && "Normalposition"}
                        {(positionTypeById[item.id] ?? "normal") === "alternative" && "Alternativposition"}
                        {(positionTypeById[item.id] ?? "normal") === "demand" && "Bedarfsposition"}
                        <svg viewBox="0 0 20 20" className="h-4 w-4 text-zinc-500" fill="currentColor">
                          <path d="M5.5 7.5L10 12l4.5-4.5" />
                        </svg>
                      </button>

                      {positionTypeMenuFor === item.id && (
                        <div
                          onMouseDown={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-2 w-56 rounded-md border border-zinc-200 bg-white shadow-sm z-20"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setPositionTypeById((prev) => ({ ...prev, [item.id]: "normal" }));
                              setPositionTypeMenuFor(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                          >
                            Normalposition
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPositionTypeById((prev) => ({ ...prev, [item.id]: "alternative" }));
                              setPositionTypeMenuFor(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                          >
                            Alternativposition
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPositionTypeById((prev) => ({ ...prev, [item.id]: "demand" }));
                              setPositionTypeMenuFor(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                          >
                            Bedarfsposition
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mt-6">
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Position hinzufügen
        </button>
      </div>

      {pendingDeleteItemId && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setPendingDeleteItemId(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
              <div className="text-base font-semibold text-zinc-900">Leistung löschen?</div>
              <div className="mt-2 text-sm text-zinc-600">
                Die Leistung wird unwiderruflich gelöscht. Diese Aktion kann nicht mehr rückgängig gemacht werden.
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDeleteItemId(null)}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = pendingDeleteItemId;
                    setPendingDeleteItemId(null);
                    onDeleteItem(id);
                  }}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Entfernen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}