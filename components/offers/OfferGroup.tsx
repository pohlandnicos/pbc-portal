import { Menu } from "@headlessui/react";
import { useState } from "react";
import type { OfferGroup, OfferItem } from "@/types/offer";

type Props = {
  group: OfferGroup;
  items: OfferItem[];
  onUpdateGroup: (group: OfferGroup) => void;
  onUpdateItem: (item: OfferItem) => void;
  onDeleteItem: (itemId: string) => void;
  onMoveItemUp: (itemId: string) => void;
  onMoveItemDown: (itemId: string) => void;
  onDuplicateItem: (itemId: string) => void;
  onAddItem: () => void;
  onImportItems: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

export default function OfferGroupSection({
  group,
  items,
  onUpdateGroup,
  onUpdateItem,
  onDeleteItem,
  onMoveItemUp,
  onMoveItemDown,
  onDuplicateItem,
  onAddItem,
  onImportItems,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-zinc-400 hover:text-zinc-600"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "▼" : "▶"}
          </button>
          <div className="flex items-center gap-1">
            <span className="text-sm text-zinc-600">{group.index}.</span>
            <input
              type="text"
              value={group.title}
              onChange={(e) => onUpdateGroup({ ...group, title: e.target.value })}
              className="text-base font-medium bg-transparent border-none p-0"
              placeholder="Titel der Leistungsgruppe"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600">
            {group.total_net.toFixed(2)} €
          </span>
          <Menu as="div" className="relative">
            <Menu.Button className="text-zinc-400 hover:text-zinc-600">
              ⋮
            </Menu.Button>
            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={onMoveUp}
                    className={`${
                      active ? "bg-zinc-50" : ""
                    } block w-full px-4 py-2 text-left text-sm`}
                  >
                    Nach oben verschieben
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={onMoveDown}
                    className={`${
                      active ? "bg-zinc-50" : ""
                    } block w-full px-4 py-2 text-left text-sm`}
                  >
                    Nach unten verschieben
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={onDelete}
                    className={`${
                      active ? "bg-zinc-50" : ""
                    } block w-full px-4 py-2 text-left text-sm text-red-600`}
                  >
                    Löschen
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="py-2 pr-4 font-medium text-left">Nr</th>
                  <th className="py-2 px-4 font-medium text-left">Art</th>
                  <th className="py-2 px-4 font-medium text-right">Menge</th>
                  <th className="py-2 px-4 font-medium text-left">Einheit</th>
                  <th className="py-2 px-4 font-medium text-left">Bezeichnung</th>
                  <th className="py-2 px-4 font-medium text-right">EK</th>
                  <th className="py-2 px-4 font-medium text-right">Aufschlag</th>
                  <th className="py-2 px-4 font-medium text-right">Marge</th>
                  <th className="py-2 px-4 font-medium text-right">EP</th>
                  <th className="py-2 pl-4 font-medium text-right">Gesamt</th>
                  <th className="py-2 pl-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-200">
                    <td className="py-2 pr-4">{item.position_index}</td>
                    <td className="py-2 px-4">
                      <select
                        value={item.type}
                        onChange={(e) =>
                          onUpdateItem({
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
                          onUpdateItem({
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
                          onUpdateItem({
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
                            onUpdateItem({
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
                            onUpdateItem({
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
                          onUpdateItem({
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
                          onUpdateItem({
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
                      <Menu as="div" className="relative">
                        <Menu.Button className="text-sm text-zinc-600 hover:text-zinc-900">
                          Normalposition ▾
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                onClick={() => onMoveItemUp(item.id)}
                                className={`${
                                  active ? "bg-zinc-50" : ""
                                } block w-full px-4 py-2 text-left text-sm`}
                              >
                                Nach oben verschieben
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                onClick={() => onMoveItemDown(item.id)}
                                className={`${
                                  active ? "bg-zinc-50" : ""
                                } block w-full px-4 py-2 text-left text-sm`}
                              >
                                Nach unten verschieben
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                onClick={() => onDuplicateItem(item.id)}
                                className={`${
                                  active ? "bg-zinc-50" : ""
                                } block w-full px-4 py-2 text-left text-sm`}
                              >
                                Duplizieren
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                onClick={() => onDeleteItem(item.id)}
                                className={`${
                                  active ? "bg-zinc-50" : ""
                                } block w-full px-4 py-2 text-left text-sm text-red-600`}
                              >
                                Löschen
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Menu>
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
              onClick={onAddItem}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Position hinzufügen
            </button>

            <button
              type="button"
              onClick={onImportItems}
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
