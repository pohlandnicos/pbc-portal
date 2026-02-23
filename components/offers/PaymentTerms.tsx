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
          <div className="relative">
            <select
              value={paymentDueDays}
              onChange={(e) => onPaymentDueDaysChange(parseInt(e.target.value))}
              className="w-full appearance-none rounded-lg border border-zinc-200 bg-white px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="7">7 Tage</option>
              <option value="14">14 Tage</option>
              <option value="30">30 Tage</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
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
