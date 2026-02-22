import type { OfferGroup, OfferItem } from "@/types/offer";
import OfferItemRow from "./OfferItem";

type Props = {
  group: OfferGroup;
  items: OfferItem[];
  onUpdateGroup: (group: OfferGroup) => void;
  onUpdateItem: (item: OfferItem) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: () => void;
  onImportItems: () => void;
};

export default function OfferGroupSection({
  group,
  items,
  onUpdateGroup,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onImportItems,
}: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          value={group.title}
          onChange={(e) => onUpdateGroup({ ...group, title: e.target.value })}
          className="text-base font-medium bg-transparent border-none p-0"
        />
        <span className="text-sm text-zinc-600">
          {group.total_net.toFixed(2)} €
        </span>
      </div>

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
    </div>
  );
}
