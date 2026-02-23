'use client';

import { useMemo, useState } from "react";
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
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const gridTemplateColumns = useMemo(
    () => "40px 120px 60px 100px 1fr 80px 80px 80px 80px 80px",
    []
  );

  return (
    <div className="mb-8">
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
            <span className="text-sm text-zinc-600">{group.index}.</span>
            <input
              type="text"
              value={group.title}
              onChange={(e) => onUpdateGroup({ ...group, title: e.target.value })}
              className="text-sm font-medium bg-transparent border-none p-0 focus:ring-0 text-zinc-600"
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
              className="text-zinc-400 hover:text-zinc-600"
              aria-label="Gruppenaktionen"
            >
              ⋮
            </button>

            {menuOpen && (
              <div
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
            <div key={item.id} className="mb-6">
              <div
                className="grid gap-4 mb-1 text-xs text-zinc-500"
                style={{ gridTemplateColumns }}
              >
                <div>Nr</div>
                <div>Art</div>
                <div>Menge</div>
                <div>Einheit</div>
                <div>Bezeichnung</div>
                <div className="text-right">Einkaufspreis</div>
                <div className="text-right">Aufschlag</div>
                <div className="text-right">Marge</div>
                <div className="text-right">Einzelpreis</div>
                <div className="text-right">Gesamtpreis</div>
              </div>

              <div
                className="grid gap-0 rounded-md border border-zinc-200 bg-zinc-50 overflow-hidden"
                style={{ gridTemplateColumns }}
              >
                <div className="flex items-center px-2 py-1 text-sm border-r border-zinc-200">
                  {item.position_index}
                </div>

                <div className="flex items-center px-2 py-1 border-r border-zinc-200">
                  <select
                    value={item.type}
                    onChange={(e) =>
                      onUpdateItem({
                        ...item,
                        type: e.target.value as OfferItem["type"],
                      })
                    }
                    className="w-full bg-transparent border-none text-sm p-0 appearance-none shadow-none focus:outline-none focus:ring-0"
                  >
                    <option value="material">Material</option>
                    <option value="labor">Arbeit</option>
                    <option value="other">Sonstiges</option>
                  </select>
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

              <div className="grid gap-3 mt-2" style={{ gridTemplateColumns: "40px minmax(280px,560px) 56px 1fr" }}>
                <div />
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
                  className="w-full border border-zinc-200 rounded-md text-sm p-2 focus:outline-none focus:ring-0 resize-none"
                />
                <button
                  type="button"
                  className="h-10 w-14 rounded-md border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
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
                <div />
              </div>

              <div className="grid gap-4 mt-2" style={{ gridTemplateColumns: "40px 1fr auto" }}>
                <div />
                <div />
                <select
                  value="normal"
                  onChange={() => {}}
                  className="text-sm border border-zinc-200 rounded-md py-1 px-2 bg-white focus:outline-none focus:ring-0"
                >
                  <option value="normal">Normalposition</option>
                  <option value="alternative">Alternativposition</option>
                  <option value="demand">Bedarfsposition</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mt-6">
        <button
          type="button"
          onClick={onAddItem}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
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
    </div>
  );
}