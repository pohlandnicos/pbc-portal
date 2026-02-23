import { useState } from "react";
import type { OfferGroup, OfferItem } from "@/types/offer";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

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
              className="text-base font-medium bg-transparent border-none p-0 focus:ring-0"
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
                <tr className="border-b border-zinc-200">
                  <th className="py-2 pr-2 font-medium text-left w-12">Nr</th>
                  <th className="py-2 px-2 font-medium text-left w-32">Art</th>
                  <th className="py-2 px-2 font-medium text-right w-20">Menge</th>
                  <th className="py-2 px-2 font-medium text-left w-28">Einheit</th>
                  <th className="py-2 px-2 font-medium text-left">Bezeichnung</th>
                  <th className="py-2 px-2 font-medium text-right w-24">EK</th>
                  <th className="py-2 px-2 font-medium text-right w-24">Aufschlag</th>
                  <th className="py-2 px-2 font-medium text-right w-24">Marge</th>
                  <th className="py-2 px-2 font-medium text-right w-24">EP</th>
                  <th className="py-2 pl-2 font-medium text-right w-24">Gesamt</th>
                  <th className="py-2 pl-2 font-medium w-36"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="py-2 pr-2 align-top">{item.position_index}</td>
                    <td className="py-2 px-2 align-top">
                      <Select
                        value={item.type}
                        onChange={(e) =>
                          onUpdateItem({
                            ...item,
                            type: e.target.value as any,
                          })
                        }
                        className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="material">Material</option>
                        <option value="labor">Arbeit</option>
                        <option value="other">Sonstiges</option>
                      </Select>
                    </td>
                    <td className="py-2 px-2 align-top">
                      <Input
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
                        className="w-full text-right rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2 align-top">
                      <Select
                        value={item.unit}
                        onChange={(e) =>
                          onUpdateItem({
                            ...item,
                            unit: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Stück">Stück</option>
                        <option value="Stunde">Stunde</option>
                        <option value="Meter">Meter</option>
                        <option value="m²">m²</option>
                        <option value="m³">m³</option>
                        <option value="kg">kg</option>
                        <option value="Pauschal">Pauschal</option>
                      </Select>
                    </td>
                    <td className="py-2 px-2">
                      <div className="space-y-2">
                        <Input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            onUpdateItem({
                              ...item,
                              name: e.target.value,
                            })
                          }
                          placeholder="Material hinzufügen"
                          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
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
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-2 align-top">
                      <Input
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
                        className="w-full text-right rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2 align-top">
                      <div className="flex items-center">
                        <Input
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
                          className="w-full text-right rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="ml-1">%</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 align-top text-right">
                      {item.margin_amount.toFixed(2)} €
                    </td>
                    <td className="py-2 px-2 align-top text-right">
                      {item.unit_price.toFixed(2)} €
                    </td>
                    <td className="py-2 pl-2 align-top text-right">
                      {item.line_total.toFixed(2)} €
                    </td>
                    <td className="py-2 pl-2 align-top">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          className="text-sm text-zinc-600 hover:text-zinc-900 whitespace-nowrap"
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
                  <td colSpan={9} className="py-2 px-2 text-right font-medium border-t border-zinc-200">
                    Zwischensumme
                  </td>
                  <td className="py-2 pl-2 text-right font-medium border-t border-zinc-200">
                    {group.total_net.toFixed(2)} €
                  </td>
                  <td className="border-t border-zinc-200"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 space-x-4">
            <button
              type="button"
              onClick={onAddItem}
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
        </>
      )}
    </div>
  );
}
