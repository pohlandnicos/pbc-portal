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
    <div>
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
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="pb-2 pr-2 font-normal text-left w-12 text-zinc-600">Nr</th>
                  <th className="pb-2 px-2 font-normal text-left w-32 text-zinc-600">Art</th>
                  <th className="pb-2 px-2 font-normal text-right w-20 text-zinc-600">Menge</th>
                  <th className="pb-2 px-2 font-normal text-left w-28 text-zinc-600">Einheit</th>
                  <th className="pb-2 px-2 font-normal text-left text-zinc-600">Bezeichnung</th>
                  <th className="pb-2 px-2 font-normal text-right w-24 text-zinc-600">EK</th>
                  <th className="pb-2 px-2 font-normal text-right w-24 text-zinc-600">Aufschlag</th>
                  <th className="pb-2 px-2 font-normal text-right w-24 text-zinc-600">Marge</th>
                  <th className="pb-2 px-2 font-normal text-right w-24 text-zinc-600">EP</th>
                  <th className="pb-2 pl-2 font-normal text-right w-24 text-zinc-600">Gesamt</th>
                  <th className="pb-2 pl-2 font-normal w-36"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="py-1 pr-2 align-top">{item.position_index}</td>
                    <td className="py-1 px-2 align-top">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                          className="w-full bg-transparent border-none text-sm focus:ring-0 py-0 pl-0 pr-6"
                        >
                          <option value="material">Material</option>
                          <option value="labor">Arbeit</option>
                          <option value="other">Sonstiges</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-1 px-2 align-top">
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
                        className="w-full text-right bg-transparent border-none text-sm focus:ring-0 py-0"
                      />
                    </td>
                    <td className="py-1 px-2 align-top">
                      <select
                        value={item.unit}
                        onChange={(e) =>
                          onUpdateItem({
                            ...item,
                            unit: e.target.value,
                          })
                        }
                        className="w-full bg-transparent border-none text-sm focus:ring-0 py-0 pl-0 pr-6"
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
                    <td className="py-1 px-2">
                      <div className="space-y-1">
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
                          className="w-full bg-transparent border-none text-sm focus:ring-0 py-0"
                        />
                        <div className="flex">
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
                            className="w-full bg-gray-50 border border-gray-200 rounded text-sm p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                          />
                          <button className="ml-2 text-gray-400 hover:text-gray-600">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M15 3h6v6M14 10l7-7m-7 17v-6m-3 6H4a1 1 0 01-1-1V4a1 1 0 011-1h6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-1 px-2 align-top">
                      <div className="flex items-center">
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
                          className="w-full text-right bg-transparent border-none text-sm focus:ring-0 py-0"
                        />
                        <span className="ml-1 text-zinc-400">€</span>
                      </div>
                    </td>
                    <td className="py-1 px-2 align-top">
                      <div className="flex items-center">
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
                          className="w-full text-right bg-transparent border-none text-sm focus:ring-0 py-0"
                        />
                        <span className="ml-1 text-zinc-400">%</span>
                      </div>
                    </td>
                    <td className="py-1 px-2 align-top text-right">
                      {item.margin_amount.toFixed(2)} €
                    </td>
                    <td className="py-1 px-2 align-top text-right">
                      {item.unit_price.toFixed(2)} €
                    </td>
                    <td className="py-1 pl-2 align-top text-right">
                      {item.line_total.toFixed(2)} €
                    </td>
                    <td className="py-1 pl-2 align-top">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap"
                        >
                          Normalposition ▾
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={9} className="pt-2 px-2 text-right text-sm text-zinc-600">
                    Zwischensumme
                  </td>
                  <td className="pt-2 pl-2 text-right text-sm text-zinc-600">
                    {group.total_net.toFixed(2)} €
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={onAddItem}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Position hinzufügen
            </button>

            <button
              type="button"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Artikel importieren (DDS)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
