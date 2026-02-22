"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { XIcon } from "lucide-react";

interface Entity {
  id: string;
  label: string;
  meta?: string;
}

interface Props {
  type: "customer" | "project";
  value?: Entity | null;
  customerId?: string; // Für Projekt-Filter
  onChange: (value: Entity | null) => void;
  disabled?: boolean;
}

export function CustomerProjectSelect({
  type,
  value,
  customerId,
  onChange,
  disabled
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Entity[]>([]);

  // Async Suche mit Debounce
  async function onSearch(query: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        ...(type === "project" && customerId
          ? { customer_id: customerId }
          : {})
      });

      const res = await fetch(
        `/api/${type === "customer" ? "customers" : "projects"}/search?${params}`
      );
      const json = await res.json();

      setResults(
        json.data.map((item: any) => ({
          id: item.id,
          label:
            type === "customer"
              ? item.type === "company"
                ? item.company_name
                : `${item.salutation} ${item.first_name} ${item.last_name}`
              : item.title,
          meta: type === "project" ? item.project_number : item.customer_number
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {value ? (
        // Ausgewählter Wert als Chip
        <div className="flex items-center gap-2 p-2 border rounded-lg">
          <div className="flex items-center gap-2 bg-zinc-100 rounded-full px-3 py-1">
            <span className="text-sm">{value.label}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        // Combobox für Suche
        <div className="relative">
          <Command
            shouldFilter={false}
            className={open ? "" : "hidden"}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
          >
            <div className="border rounded-lg">
              <input
                value={search}
                onFocus={() => setOpen(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  onSearch(e.target.value);
                }}
                placeholder={`${type === "customer" ? "Kunde" : "Projekt"} auswählen`}
                className="w-full px-3 py-2 text-sm outline-none"
              />

              {open && (
                <div className="border-t">
                  <Command.List className="max-h-[300px] overflow-auto p-2">
                    {loading ? (
                      <Command.Loading>Laden...</Command.Loading>
                    ) : results.length === 0 ? (
                      <Command.Empty>Keine Ergebnisse</Command.Empty>
                    ) : (
                      results.map((item) => (
                        <Command.Item
                          key={item.id}
                          value={item.id}
                          onSelect={() => {
                            onChange(item);
                            setOpen(false);
                            setSearch("");
                          }}
                          className="flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-zinc-100"
                        >
                          <span>{item.label}</span>
                          {item.meta && (
                            <span className="text-zinc-500">{item.meta}</span>
                          )}
                        </Command.Item>
                      ))
                    )}
                  </Command.List>
                </div>
              )}
            </div>
          </Command>

          {/* Placeholder wenn geschlossen */}
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-full px-3 py-2 text-sm text-left border rounded-lg text-zinc-500"
            >
              {`${type === "customer" ? "Kunde" : "Projekt"} auswählen`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
