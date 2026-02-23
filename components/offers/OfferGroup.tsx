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
    <div className="bg-white rounded-lg">
      <div className="flex items-center justify-between p-4">
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
        <div className="px-4 pb-4">
          {items.map((item) => (
            <div key={item.id} className="mb-6">
              {/* Header mit Labels */}
              <div className="grid grid-cols-10 gap-4 mb-1 text-xs text-zinc-500">
                <div>Nr</div>
                <div>Art</div>
                <div>Menge</div>
                <div>Einheit</div>
                <div className="col-span-2">Bezeichnung</div>
                <div>Einkaufspreis</div>
                <div>Aufschlag</div>
                <div>Marge</div>
                <div>Einzelpreis</div>
                <div>Gesamtpreis</div>
              </div>

              {/* Eingabezeile */}
              <div className="grid grid-cols-10 gap-4 mb-2">
                <div>{item.position_index}</div>
                <div>
                  <div className="flex items-center bg-white border rounded-md">
                    <svg className="w-4 h-4 ml-2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                      className="w-full border-none text-sm focus:ring-0 py-1"
                    >
                      <option value="material">Material</option>
                      <option value="labor">Arbeit</option>
                      <option value="other">Sonstiges</option>
                    </select>
                  </div>
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
                    className="w-full text-right border rounded-md text-sm py-1 px-2"
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
                    className="w-full border rounded-md text-sm py-1 px-2"
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
                <div className="col-span-2">
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
                    className="w-full border rounded-md text-sm py-1 px-2"
                  />
                </div>
                <div>
                  <div className="flex items-center border rounded-md">
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
                      className="w-full text-right border-none text-sm py-1 px-2"
                    />
                    <span className="mr-2 text-zinc-400">€</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center border rounded-md">
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
                      className="w-full text-right border-none text-sm py-1 px-2"
                    />
                    <span className="mr-2 text-zinc-400">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-end px-2">
                  {item.margin_amount.toFixed(2)} €
                </div>
                <div className="flex items-center justify-end px-2">
                  {item.unit_price.toFixed(2)} €
                </div>
                <div className="flex items-center justify-end px-2">
                  {item.line_total.toFixed(2)} €
                </div>
              </div>

              {/* Beschreibung und Bild */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <textarea
                    value={item.description ?? ""}
                    onChange={(e) =>
                      onUpdateItem({
                        ...item,
                        description: e.target.value || null,
                      })
                    }
                    placeholder="Beschreibung"
                    rows={4}
                    className="w-full border rounded-md text-sm p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="w-32 flex flex-col items-center justify-center border rounded-md border-dashed">
                  <svg className="w-8 h-8 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-zinc-500 mt-1">Bild hinzufügen</span>
                </div>
              </div>

              {/* Position Type Selector */}
              <div className="flex justify-end mt-2">
                <select
                  value="normal"
                  onChange={() => {}}
                  className="text-sm border rounded-md py-1 px-3 bg-gray-50"
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
              className="flex items-center gap-2 text-sm bg-white border rounded-md px-3 py-1.5 hover:bg-gray-50"
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
