"use client";

import { useState } from "react";
import { Listbox } from "@headlessui/react";
import { ChevronDownIcon, TrashIcon, ImageIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const TYPES = [
  { value: "material", label: "Material" },
  { value: "labor", label: "Lohn" },
  { value: "other", label: "Sonstige" }
];

const UNITS = [
  { value: "piece", label: "Stück" },
  { value: "hour", label: "Stunde" },
  { value: "day", label: "Tag" },
  { value: "meter", label: "Meter" },
  { value: "sqm", label: "m²" },
  { value: "cbm", label: "m³" },
  { value: "kg", label: "kg" },
  { value: "ton", label: "Tonne" },
  { value: "package", label: "Paket" },
  { value: "set", label: "Set" }
];

interface Props {
  index: string;
  type: string;
  name: string;
  description?: string;
  qty: number;
  unit: string;
  purchasePrice: number;
  markupPercent: number;
  marginAmount: number;
  unitPrice: number;
  lineTotal: number;
  onUpdate: (changes: Partial<{
    type: string;
    name: string;
    description: string;
    qty: number;
    unit: string;
    purchasePrice: number;
    markupPercent: number;
    marginAmount: number;
  }>) => void;
  onDelete: () => void;
}

export function LineItem({
  index,
  type,
  name,
  description,
  qty,
  unit,
  purchasePrice,
  markupPercent,
  marginAmount,
  unitPrice,
  lineTotal,
  onUpdate,
  onDelete
}: Props) {
  const [expanded, setExpanded] = useState(false);

  // Formatierung für Inputs
  const formatNumber = (value: string) => {
    const num = parseFloat(value.replace(",", "."));
    return isNaN(num) ? 0 : num;
  };

  return (
    <div className="space-y-2">
      {/* Hauptzeile */}
      <div className="grid grid-cols-10 gap-4 items-center">
        {/* Nr */}
        <div className="text-sm text-zinc-500">{index}</div>

        {/* Art */}
        <Listbox
          value={type}
          onChange={(value) => onUpdate({ type: value })}
        >
          <div className="relative">
            <Listbox.Button className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-zinc-50">
              <span>
                {TYPES.find((t) => t.value === type)?.label ?? type}
              </span>
              <ChevronDownIcon className="w-4 h-4" />
            </Listbox.Button>
            <Listbox.Options className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
              {TYPES.map((type) => (
                <Listbox.Option
                  key={type.value}
                  value={type.value}
                  className={({ active }) =>
                    `px-3 py-2 text-sm cursor-pointer ${
                      active ? "bg-zinc-50" : ""
                    }`
                  }
                >
                  {type.label}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>

        {/* Menge */}
        <input
          type="text"
          value={qty}
          onChange={(e) =>
            onUpdate({ qty: formatNumber(e.target.value) })
          }
          className="w-full px-3 py-1.5 text-sm text-right border rounded-lg"
        />

        {/* Einheit */}
        <Listbox
          value={unit}
          onChange={(value) => onUpdate({ unit: value })}
        >
          <div className="relative">
            <Listbox.Button className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-zinc-50">
              <span>
                {UNITS.find((u) => u.value === unit)?.label ?? unit}
              </span>
              <ChevronDownIcon className="w-4 h-4" />
            </Listbox.Button>
            <Listbox.Options className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-48 overflow-auto">
              {UNITS.map((unit) => (
                <Listbox.Option
                  key={unit.value}
                  value={unit.value}
                  className={({ active }) =>
                    `px-3 py-2 text-sm cursor-pointer ${
                      active ? "bg-zinc-50" : ""
                    }`
                  }
                >
                  {unit.label}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>

        {/* Bezeichnung */}
        <div className="col-span-2">
          <input
            type="text"
            value={name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Material hinzufügen"
            className="w-full px-3 py-1.5 text-sm border rounded-lg"
          />
        </div>

        {/* Einkaufspreis */}
        <input
          type="text"
          value={purchasePrice.toFixed(2).replace(".", ",")}
          onChange={(e) =>
            onUpdate({ purchasePrice: formatNumber(e.target.value) })
          }
          className="w-full px-3 py-1.5 text-sm text-right border rounded-lg"
        />

        {/* Aufschlag % */}
        <input
          type="text"
          value={markupPercent.toFixed(1).replace(".", ",")}
          onChange={(e) =>
            onUpdate({ markupPercent: formatNumber(e.target.value) })
          }
          className="w-full px-3 py-1.5 text-sm text-right border rounded-lg"
        />

        {/* Marge € */}
        <input
          type="text"
          value={marginAmount.toFixed(2).replace(".", ",")}
          onChange={(e) =>
            onUpdate({ marginAmount: formatNumber(e.target.value) })
          }
          className="w-full px-3 py-1.5 text-sm text-right border rounded-lg"
        />

        {/* Einzelpreis */}
        <div className="text-right text-sm">
          {formatCurrency(unitPrice)}
        </div>

        {/* Gesamtpreis */}
        <div className="text-right text-sm font-medium">
          {formatCurrency(lineTotal)}
        </div>

        {/* Aktionen */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Beschreibung & Bild */}
      {expanded && (
        <div className="pl-8 grid grid-cols-2 gap-4">
          <div>
            <textarea
              value={description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Beschreibung"
              rows={3}
              className="w-full px-3 py-2 text-sm border rounded-lg resize-none"
            />
          </div>
          <div className="flex items-center justify-center border rounded-lg bg-zinc-50 text-zinc-400">
            <ImageIcon className="w-6 h-6" />
          </div>
        </div>
      )}
    </div>
  );
}
