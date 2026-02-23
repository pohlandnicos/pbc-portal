type Props = {
  paymentDueDays: number;
  discountPercent: number | null;
  discountDays: number | null;
  onPaymentDueDaysChange: (days: number) => void;
  onDiscountPercentChange: (percent: number | null) => void;
  onDiscountDaysChange: (days: number | null) => void;
};

export default function PaymentTerms({
  paymentDueDays,
  discountPercent,
  discountDays,
  onPaymentDueDaysChange,
  onDiscountPercentChange,
  onDiscountDaysChange,
}: Props) {
  return (
    <div>
      <h2 className="text-base font-medium mb-4">Zahlungsbedingungen</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Zahlungsziel
          </label>
          <select
            value={paymentDueDays}
            onChange={(e) => onPaymentDueDaysChange(parseInt(e.target.value))}
            className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
          >
            <option value="7">7 Tage</option>
            <option value="14">14 Tage</option>
            <option value="30">30 Tage</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Skonto
          </label>
          <input
            type="number"
            value={discountPercent ?? ""}
            onChange={(e) =>
              onDiscountPercentChange(
                e.target.value ? parseFloat(e.target.value) : null
              )
            }
            className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
            placeholder="0 %"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Zeitraum
          </label>
          <input
            type="number"
            value={discountDays ?? ""}
            onChange={(e) =>
              onDiscountDaysChange(
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
            placeholder="0 Tage"
          />
        </div>
      </div>

      <div className="mt-4 text-sm">
        Der fällige Betrag ist ohne Abzug zahlbar innerhalb von{" "}
        {paymentDueDays} Tagen ab Rechnungsdatum.
      </div>
    </div>
  );
}
