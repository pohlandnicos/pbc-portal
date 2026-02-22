"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { XIcon } from "lucide-react";

interface Props {
  percent?: number;
  days?: number;
  onApply: (values: { percent: number; days: number }) => void;
  onClose: () => void;
}

export function DiscountDialog({
  percent = 0,
  days = 0,
  onApply,
  onClose
}: Props) {
  const [values, setValues] = useState({ percent, days });

  // Formatierung für Inputs
  const formatNumber = (value: string) => {
    const num = parseFloat(value.replace(",", "."));
    return isNaN(num) ? 0 : num;
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <Dialog.Title className="text-lg font-semibold">
              Skonto hinzufügen
            </Dialog.Title>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 rounded"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Skonto Prozent
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={values.percent.toFixed(1).replace(".", ",")}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      percent: formatNumber(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg pr-8"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sm text-zinc-500">
                  %
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Skonto Zeitraum
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={values.days}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      days: formatNumber(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg pr-12"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sm text-zinc-500">
                  Tage
                </div>
              </div>
            </div>
          </div>

          <div className="border-t px-4 py-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg hover:bg-zinc-50"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={() => onApply(values)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Übernehmen
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
