import type { OfferItem } from "@/types/offer";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type Props = {
  item: OfferItem;
  onUpdate: (item: OfferItem) => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
  onDuplicate: () => void;
};

export default function OfferItemRow({
  item,
  onUpdate,
  onDelete,
  onMove,
  onDuplicate,
}: Props) {
  return (
    <tr className="border-b border-zinc-200">
      <td className="py-2 pr-4">{item.position_index}</td>
      <td className="py-2 px-4">
        <Select
          value={item.type}
          onChange={(e) =>
            onUpdate({
              ...item,
              type: e.target.value as any,
            })
          }
          compact
          fullWidth
        >
          <option value="material">Material</option>
          <option value="labor">Arbeit</option>
          <option value="mixed">Mischposition</option>
          <option value="other">Sonstiges</option>
        </Select>
      </td>
      <td className="py-2 px-4">
        <Input
          type="number"
          value={item.qty}
          onChange={(e) =>
            onUpdate({
              ...item,
              qty: parseFloat(e.target.value),
            })
          }
          min={0}
          step={0.01}
          className="w-20 text-right"
          compact
        />
      </td>
      <td className="py-2 px-4">
        <Select
          value={item.unit}
          onChange={(e) =>
            onUpdate({
              ...item,
              unit: e.target.value,
            })
          }
          compact
          fullWidth
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
      <td className="py-2 px-4">
        <div className="space-y-2">
          <Input
            type="text"
            value={item.name}
            onChange={(e) =>
              onUpdate({
                ...item,
                name: e.target.value,
              })
            }
            placeholder="Material hinzufügen"
            fullWidth
            compact
          />
          <textarea
            value={item.description ?? ""}
            onChange={(e) =>
              onUpdate({
                ...item,
                description: e.target.value || null,
              })
            }
            placeholder="Beschreibung"
            rows={2}
            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </td>
      <td className="py-2 px-4">
        <Input
          type="number"
          value={item.purchase_price}
          onChange={(e) =>
            onUpdate({
              ...item,
              purchase_price: parseFloat(e.target.value),
            })
          }
          min={0}
          step={0.01}
          className="w-20 text-right"
          compact
        />
      </td>
      <td className="py-2 px-4">
        <Input
          type="number"
          value={item.markup_percent}
          onChange={(e) =>
            onUpdate({
              ...item,
              markup_percent: parseFloat(e.target.value),
            })
          }
          min={0}
          step={0.1}
          className="w-20 text-right"
          compact
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
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          Normalposition ▾
        </button>
      </td>
    </tr>
  );
}
