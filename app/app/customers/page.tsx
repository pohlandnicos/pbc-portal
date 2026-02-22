"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerCreateDialog } from "@/components/customers/CustomerCreateDialog";

type CustomerRow = {
  id: string;
  type: "private" | "company";
  company_name: string | null;
  salutation: string | null;
  first_name: string | null;
  last_name: string | null;
  billing_address_extra: string | null;
  billing_city: string;
  projectsCount: number;
};

export default function CustomersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<CustomerRow[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customers", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | { data?: CustomerRow[]; error?: string }
        | null;
      if (!res.ok) {
        setError("Laden fehlgeschlagen");
        return;
      }
      setRows(json?.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const displayRows = useMemo(() => {
    return rows.map((r) => {
      const name =
        r.type === "company"
          ? r.company_name ?? ""
          : `${r.salutation ?? ""} ${r.first_name ?? ""} ${r.last_name ?? ""}`.trim();
      return { ...r, name };
    });
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Kunden</h1>
          <p className="text-sm text-zinc-700">Übersicht</p>
        </div>
        <CustomerCreateDialog
          onCreated={() => {
            router.refresh();
            void load();
          }}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Kundenname</th>
              <th className="px-4 py-3 font-medium">Adresszusatz</th>
              <th className="px-4 py-3 font-medium">Anzahl Projekte</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-3" colSpan={3}>
                  Laden...
                </td>
              </tr>
            ) : displayRows.length === 0 ? (
              <tr>
                <td className="px-4 py-3" colSpan={3}>
                  Noch keine Kunden vorhanden.
                </td>
              </tr>
            ) : (
              displayRows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-zinc-200 last:border-b-0 hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link className="text-zinc-900 underline" href={`/app/customers/${r.id}`}>
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.billing_address_extra ?? ""}</td>
                  <td className="px-4 py-3">{r.projectsCount ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
