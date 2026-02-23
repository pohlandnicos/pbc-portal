import { Menu } from "@headlessui/react";
import type { OfferItem } from "@/types/offer";

type Props = {
  item: OfferItem;
  onUpdate: (item: OfferItem) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
};

export default function OfferItemRow({
  item,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
}: Props) {
  // Berechne Werte
  function updateValues(updates: Partial<OfferItem>) {
    const newItem = { ...item, ...updates };

    // Berechne Marge
    newItem.margin_amount =
      newItem.purchase_price * (newItem.markup_percent / 100);

    // Berechne Einzelpreis
    newItem.unit_price = newItem.purchase_price + newItem.margin_amount;

    // Berechne Gesamtpreis
    newItem.line_total = newItem.unit_price * newItem.qty;

    onUpdate(newItem);
  }

  return (
    <tr className="border-b border-zinc-200">
      <td className="py-2 pr-4">{item.position_index}</td>
      <td className="py-2 px-4">
        <select
          value={item.type}
          onChange={(e) => updateValues({ type: e.target.value as any })}
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
          onChange={(e) => updateValues({ qty: parseFloat(e.target.value) })}
          min={0}
          step={0.01}
          className="w-24 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-right"
        />
      </td>
      <td className="py-2 px-4">
        <input
          type="text"
          value={item.unit}
          onChange={(e) => updateValues({ unit: e.target.value })}
          className="w-24 rounded-lg border border-zinc-200 px-4 py-2 text-sm"
        />
      </td>
      <td className="py-2 px-4">
        <div className="space-y-2">
          <input
            type="text"
            value={item.name}
            onChange={(e) => updateValues({ name: e.target.value })}
            placeholder="Bezeichnung"
            className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
          />
          <textarea
            value={item.description ?? ""}
            onChange={(e) =>
              updateValues({ description: e.target.value || null })
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
            updateValues({ purchase_price: parseFloat(e.target.value) })
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
            updateValues({ markup_percent: parseFloat(e.target.value) })
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
                  onClick={onDuplicate}
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
      </td>
    </tr>
  );
}
