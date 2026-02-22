"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, MoreVerticalIcon } from "lucide-react";
import { Menu } from "@headlessui/react";
import { LineItem } from "./LineItem";
import { formatCurrency } from "@/lib/format";

interface Props {
  id: string;
  index: number;
  title: string;
  items: Array<{
    id: string;
    type: string;
    name: string;
    description?: string;
    qty: number;
    unit: string;
    purchase_price: number;
    markup_percent: number;
    margin_amount: number;
    unit_price: number;
    line_total: number;
  }>;
  totals: {
    material_cost: number;
    labor_cost: number;
    other_cost: number;
    material_margin: number;
    labor_margin: number;
    other_margin: number;
    total_net: number;
  };
  onUpdateTitle: (title: string) => void;
  onAddItem: () => void;
  onUpdateItem: (
    itemId: string,
    changes: Partial<{
      type: string;
      name: string;
      description: string;
      qty: number;
      unit: string;
      purchase_price: number;
      markup_percent: number;
      margin_amount: number;
    }>
  ) => void;
  onDeleteItem: (itemId: string) => void;
  onDelete: () => void;
}

export function LineItemGroup({
  id,
  index,
  title,
  items,
  totals,
  onUpdateTitle,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onDelete
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-zinc-400 hover:text-zinc-600"
          >
            {expanded ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>

          {editingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditingTitle(false);
                }
              }}
              className="text-lg font-medium px-2 py-1 border rounded-lg"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="text-lg font-medium hover:bg-zinc-50 px-2 py-1 rounded-lg"
            >
              {index}. {title}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-lg font-medium">
            {formatCurrency(totals.total_net)}
          </div>

          <Menu as="div" className="relative">
            <Menu.Button className="p-1 text-zinc-400 hover:text-zinc-600 rounded">
              <MoreVerticalIcon className="w-5 h-5" />
            </Menu.Button>

            <Menu.Items className="absolute right-0 mt-1 w-48 rounded-lg border bg-white shadow-lg overflow-hidden">
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={onDelete}
                    className={`w-full px-4 py-2 text-sm text-left ${
                      active ? "bg-zinc-50" : ""
                    }`}
                  >
                    Gruppe löschen
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="space-y-6">
          {/* Items */}
          <div className="space-y-4">
            {items.map((item) => (
              <LineItem
                key={item.id}
                index={`${index}.${items.indexOf(item) + 1}`}
                type={item.type}
                name={item.name}
                description={item.description}
                qty={item.qty}
                unit={item.unit}
                purchasePrice={item.purchase_price}
                markupPercent={item.markup_percent}
                marginAmount={item.margin_amount}
                unitPrice={item.unit_price}
                lineTotal={item.line_total}
                onUpdate={(changes) => onUpdateItem(item.id, changes)}
                onDelete={() => onDeleteItem(item.id)}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onAddItem}
              className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md"
            >
              Position hinzufügen
            </button>

            <button
              type="button"
              className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md"
            >
              Artikel importieren (IDS)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
