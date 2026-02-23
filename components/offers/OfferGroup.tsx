import { useState } from "react";
import type { OfferGroup, OfferItem } from "@/types/offer";

type Props = {
  group: OfferGroup;
  items: OfferItem[];
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
  onUpdateGroup,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onMoveItem,
  onDuplicateItem,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  // Stelle sicher, dass immer mindestens eine leere Position existiert
  if (items.length === 0) {
    onAddItem();
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-zinc-400 hover:text-zinc-600"
          >
            {expanded ? "▼" : "▶"}
          </button>
          <div className="flex items-center gap-1">
            <span className="text-sm text-zinc-600">{group.index}.</span>
            <input
              type="text"
              value={group.title}
              onChange={(e) =>
                onUpdateGroup({ ...group, title: e.target.value })
              }
              className="text-sm font-medium bg-transparent border-none p-0 focus:ring-0 text-zinc-600"
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
          >
            ⋮
          </button>
        </div>
      </div>

      {expanded && (
        <div>
          {items.map((item) => (
            <div key={item.id} className="mb-6">
              {/* Header mit Labels */}
              <div className="grid gap-2 mb-1 text-xs text-zinc-600" style={{ gridTemplateColumns: "40px 120px 60px 100px 1fr 80px 80px 80px 80px 80px" }}>
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

              {/* Eingabezeile */}
              <div className="grid gap-2 bg-blue-50/50 py-1" style={{ gridTemplateColumns: "40px 120px 60px 100px 1fr 80px 80px 80px 80px 80px" }}>
                <div className="flex items-center px-1">{item.position_index}</div>
                <div className="flex items-center bg-white">
                  <svg className="w-4 h-4 ml-1 text-zinc-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                  </svg>
                  <select
                    value={item.type}
                    onChange={(e) =>
                      onUpdateItem({
                        ...item,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full border-none text-sm focus:ring-0 py-1 bg-transparent"
                  >
                    <option value="material">Material</option>
                    <option value="labor">Arbeit</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) =>
                      onUpdateItem({
                        ...item,
                        qty: parseFloat(e.target.value),
                      })
                    }
                    min={0}
                    step={0.01}
                    className="w-full text-right bg-white border-none text-sm py-1 px-2"
                  />
                </div>
                <div>
                  <select
                    value={item.unit}
                    onChange={(e) =>
                      onUpdateItem({
                        ...item,
                        unit: e.target.value,
                      })
                    }
                    className="w-full bg-white border-none text-sm py-1 px-2"
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
                <div>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      onUpdateItem({
                        ...item,
                        name: e.target.value,
                      })
                    }
                    placeholder="Material hinzufügen"
                    className="w-full bg-white border-none text-sm py-1 px-2"
                  />
                </div>
                <div>
                  <div className="flex items-center bg-white">
                    <input
                      type="number"
                      value={item.purchase_price}
                      onChange={(e) =>
                        onUpdateItem({
                          ...item,
                          purchase_price: parseFloat(e.target.value),
                        })
                      }
                      min={0}
                      step={0.01}
                      className="w-full text-right border-none text-sm py-1 pl-2"
                    />
                    <span className="pr-2 text-zinc-400">€</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center bg-white">
                    <input
                      type="number"
                      value={item.markup_percent}
                      onChange={(e) =>
                        onUpdateItem({
                          ...item,
                          markup_percent: parseFloat(e.target.value),
                        })
                      }
                      min={0}
                      step={0.1}
                      className="w-full text-right border-none text-sm py-1 pl-2"
                    />
                    <span className="pr-2 text-zinc-400">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-end px-2 bg-white">
                  {item.margin_amount.toFixed(2)} €
                </div>
                <div className="flex items-center justify-end px-2 bg-white">
                  {item.unit_price.toFixed(2)} €
                </div>
                <div className="flex items-center justify-end px-2 bg-white">
                  {item.line_total.toFixed(2)} €
                </div>
              </div>

              {/* Beschreibung und Bild */}
              <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: "40px 1fr 48px" }}>
                <div></div>
                <textarea
                  value={item.description ?? ""}
                  onChange={(e) =>
                    onUpdateItem({
                      ...item,
                      description: e.target.value || null,
                    })
                  }
                  placeholder="Beschreibung"
                  rows={3}
                  className="w-full bg-white border-none text-sm p-2 focus:ring-1 focus:ring-blue-500 resize-none"
                />
                <button className="flex items-center justify-center bg-white">
                  <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              {/* Position Type Selector */}
              <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: "40px 1fr auto" }}>
                <div></div>
                <div></div>
                <select
                  value="normal"
                  onChange={() => {}}
                  className="text-sm bg-gray-50 border-none py-1 px-3"
                >
                  <option value="normal">Normalposition</option>
                  <option value="alternative">Alternativposition</option>
                  <option value="demand">Bedarfsposition</option>
                </select>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-4 mt-6">
            <button
              type="button"
              onClick={onAddItem}
              className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 hover:bg-gray-100"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Position hinzufügen
            </button>

            <button
              type="button"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Artikel importieren (DDS)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
