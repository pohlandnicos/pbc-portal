import type { OfferItem } from "@/types/offer";

type Props = {
  item: OfferItem;
  onUpdate: (item: OfferItem) => void;
  onDelete: () => void;
};

export default function OfferItemRow({ item, onUpdate, onDelete }: Props) {
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
        <button
          type="button"
          onClick={onDelete}
          className="text-zinc-400 hover:text-zinc-600"
        >
          ×
        </button>
      </td>
    </tr>
  );
}
