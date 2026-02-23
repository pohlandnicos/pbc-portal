import { Menu } from "@headlessui/react";
import type { OfferGroup, OfferItem } from "@/types/offer";
import OfferItemRow from "./OfferItem";

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
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-zinc-400 hover:text-zinc-600"
            onClick={() => group.expanded = !group.expanded}
          >
            {group.expanded ? "▼" : "▶"}
          </button>
          <input
            type="text"
            value={group.title}
            onChange={(e) => onUpdateGroup({ ...group, title: e.target.value })}
            className="text-base font-medium bg-transparent border-none p-0"
          />
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

      {group.expanded && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="py-2 pr-4 font-medium text-left">Pos</th>
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
                  <OfferItemRow
                    key={item.id}
                    item={item}
                    onUpdate={onUpdateItem}
                    onDelete={() => onDeleteItem(item.id)}
                    onMoveUp={() => onMoveItemUp(item.id)}
                    onMoveDown={() => onMoveItemDown(item.id)}
                    onDuplicate={() => onDuplicateItem(item.id)}
                  />
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
