"use client";

import { ChevronDownIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface Props {
  totals: {
    material_cost: number;
    labor_cost: number;
    other_cost: number;
    material_margin: number;
    labor_margin: number;
    other_margin: number;
    total_net: number;
    total_tax: number;
    total_gross: number;
  };
  onAdjustMargins: () => void;
  onAddDiscount: () => void;
  taxRate: number;
  showLaborTax: boolean;
  onToggleLaborTax: () => void;
}

export function SummaryBox({
  totals,
  onAdjustMargins,
  onAddDiscount,
  taxRate,
  showLaborTax,
  onToggleLaborTax
}: Props) {
  return (
    <div className="sticky top-6 space-y-6 rounded-xl border bg-white p-4">
      {/* Nettosumme */}
      <div>
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-1 font-medium">
            Nettosumme <ChevronDownIcon className="w-4 h-4" />
          </button>
          <div className="font-medium">{formatCurrency(totals.total_net)}</div>
        </div>

        <div className="mt-4 space-y-4">
          {/* Kosten */}
          <div>
            <div className="text-sm font-medium text-zinc-900">Kosten</div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Materialkosten</span>
                <span>{formatCurrency(totals.material_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Lohnkosten</span>
                <span>{formatCurrency(totals.labor_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sonstige Kosten</span>
                <span>{formatCurrency(totals.other_cost)}</span>
              </div>
            </div>
          </div>

          {/* Margen */}
          <div>
            <div className="text-sm font-medium text-zinc-900">Gesamtmarge</div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Marge auf Materialkosten</span>
                <span>{formatCurrency(totals.material_margin)}</span>
              </div>
              <div className="flex justify-between">
                <span>Marge auf Lohnkosten</span>
                <span>{formatCurrency(totals.labor_margin)}</span>
              </div>
              <div className="flex justify-between">
                <span>Marge auf sonstige Kosten</span>
                <span>{formatCurrency(totals.other_margin)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aktionen */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={onAdjustMargins}
          className="w-full text-sm text-blue-600 hover:bg-blue-50 rounded-lg px-3 py-2"
        >
          Margen anpassen
        </button>

        <button
          type="button"
          onClick={onAddDiscount}
          className="w-full text-sm text-blue-600 hover:bg-blue-50 rounded-lg px-3 py-2"
        >
          Rabatt hinzufügen
        </button>
      </div>

      {/* Steuer */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span className="text-sm">{taxRate}% Umsatzsteuer</span>
            <ChevronDownIcon className="w-4 h-4" />
          </div>
          <div className="text-sm">{formatCurrency(totals.total_tax)}</div>
        </div>

        <div className="flex justify-between items-center text-lg font-medium">
          <span>Gesamtbetrag</span>
          <span>{formatCurrency(totals.total_gross)}</span>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showLaborTax}
            onChange={onToggleLaborTax}
            className="rounded border-zinc-300"
          />
          <span className="text-sm">Umsatzsteuer für Lohnkosten ausweisen</span>
        </label>
      </div>
    </div>
  );
}
