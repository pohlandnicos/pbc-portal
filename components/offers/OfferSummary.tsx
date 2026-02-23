import { useState } from "react";

type Props = {
  materialCost: number;
  laborCost: number;
  otherCost: number;
  materialMargin: number;
  laborMargin: number;
  otherMargin: number;
  taxRate: number;
  showVatForLabor: boolean;
  onShowVatForLaborChange: (show: boolean) => void;
  onTaxRateChange: (rate: number) => void;
};

export default function OfferSummary({
  materialCost,
  laborCost,
  otherCost,
  materialMargin,
  laborMargin,
  otherMargin,
  taxRate,
  showVatForLabor,
  onShowVatForLaborChange,
  onTaxRateChange,
}: Props) {
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);

  // Berechne Summen
  const totalCost = materialCost + laborCost + otherCost;
  const totalMargin = materialMargin + laborMargin + otherMargin;
  const totalNet = totalCost + totalMargin;

  // Berechne Rabatt
  const discountAmount = discountPercent ? totalNet * (discountPercent / 100) : 0;
  const netAfterDiscount = totalNet - discountAmount;

  // Berechne Steuer
  const taxAmount = netAfterDiscount * (taxRate / 100);
  const laborTaxBase = laborCost + laborMargin;
  const laborTaxAmount = showVatForLabor ? laborTaxBase * (taxRate / 100) : 0;

  // Berechne Brutto
  const totalGross = netAfterDiscount + taxAmount;

  return (
    <div className="space-y-8">
      {/* Nettosumme */}
      <div>
        <h3 className="text-sm font-medium mb-2">Nettosumme</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-600">Materialkosten</span>
            <span>{materialCost.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Lohnkosten</span>
            <span>{laborCost.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Sonstige Kosten</span>
            <span>{otherCost.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Kosten gesamt</span>
            <span>{totalCost.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Margen */}
      <div>
        <h3 className="text-sm font-medium mb-2">Gesamtmarge</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-600">Marge auf Materialkosten</span>
            <span>{materialMargin.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Marge auf Lohnkosten</span>
            <span>{laborMargin.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Marge auf sonstige Kosten</span>
            <span>{otherMargin.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Marge gesamt</span>
            <span>{totalMargin.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Rabatt */}
      <div>
        <button
          type="button"
          onClick={() => setDiscountPercent(0)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Rabatt hinzufügen
        </button>

        {discountPercent !== null && (
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={discountPercent}
                onChange={(e) =>
                  setDiscountPercent(parseFloat(e.target.value))
                }
                className="w-20 rounded-lg border border-zinc-200 px-2 py-1 text-right"
              />
              <span>%</span>
              <span className="text-zinc-600">
                ({discountAmount.toFixed(2)} €)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Steuer */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <select
            value={taxRate}
            onChange={(e) => onTaxRateChange(parseFloat(e.target.value))}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm"
          >
            <option value="19">19% Umsatzsteuer</option>
            <option value="7">7% Umsatzsteuer</option>
            <option value="0">0% Umsatzsteuer</option>
          </select>
          <span className="text-sm">
            {taxAmount.toFixed(2)} €
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showVatForLabor}
            onChange={(e) => onShowVatForLaborChange(e.target.checked)}
            className="rounded border-zinc-300"
          />
          <span className="text-sm">
            Umsatzsteuer für Lohnkosten ausweisen
          </span>
        </div>

        {showVatForLabor && (
          <div className="text-sm text-zinc-600">
            Im Bruttobetrag sind {laborTaxBase.toFixed(2)} € (netto) Lohnkosten
            enthalten. Die darin enthaltene Umsatzsteuer beträgt{" "}
            {laborTaxAmount.toFixed(2)} €.
          </div>
        )}
      </div>

      {/* Gesamtbetrag */}
      <div className="flex justify-between items-center text-lg font-medium">
        <span>Gesamtbetrag</span>
        <span>{totalGross.toFixed(2)} €</span>
      </div>
    </div>
  );
}
