"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OfferListRow = {
  id: string;
  title: string;
  offer_number: string | null;
  offer_date: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "cancelled";
  total_net: number | null;
  total_gross: number | null;
  customers?: {
    id: string;
    type?: "private" | "company";
    company_name?: string | null;
    salutation?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
};

function formatDateDE(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function currencyEUR(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

export default function OffersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<OfferListRow[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/offers", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as
          | { data?: OfferListRow[]; error?: string; message?: string }
          | null;

        if (!res.ok) {
          setError(json?.message ?? json?.error ?? `Laden fehlgeschlagen (HTTP ${res.status})`);
          setRows([]);
          return;
        }

        setRows(json?.data ?? []);
      } catch {
        setError("Laden fehlgeschlagen");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const customerNameByRow = useMemo(() => {
    return new Map(
      rows.map((r) => {
        const c = r.customers;
        const name = c?.type === "company"
          ? (c.company_name ?? "")
          : `${c?.first_name ?? ""} ${c?.last_name ?? ""}`.trim();
        return [r.id, name] as const;
      })
    );
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <h1 className="text-lg font-medium">Angebote</h1>
        <Link
          href="/app/offers/new"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Angebot erstellen
        </Link>
      </div>

      <div className="rounded border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white text-left text-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium border-b border-zinc-200">Datum</th>
              <th className="px-4 py-3 font-medium border-b border-zinc-200">Nummer</th>
              <th className="px-4 py-3 font-medium border-b border-zinc-200">Status</th>
              <th className="px-4 py-3 font-medium border-b border-zinc-200">Name</th>
              <th className="px-4 py-3 font-medium border-b border-zinc-200">Kunde</th>
              <th className="px-4 py-3 font-medium text-right border-b border-zinc-200">Betrag</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-3 text-zinc-600" colSpan={6}>
                  Lädt...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-4 py-3 text-red-700" colSpan={6}>
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-3" colSpan={6}>
                  Noch keine Angebote vorhanden.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/app/offers/${r.id}`} className="hover:underline">
                      {formatDateDE(r.offer_date)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{r.offer_number ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        {
                          draft: "bg-zinc-100 text-zinc-800",
                          sent: "bg-blue-100 text-blue-800",
                          accepted: "bg-green-100 text-green-800",
                          rejected: "bg-red-100 text-red-800",
                          cancelled: "bg-zinc-100 text-zinc-800",
                        }[r.status]
                      }`}
                    >
                      {{
                        draft: "Entwurf",
                        sent: "Gesendet",
                        accepted: "Angenommen",
                        rejected: "Abgelehnt",
                        cancelled: "Storniert",
                      }[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/app/offers/${r.id}`} className="hover:underline">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{customerNameByRow.get(r.id) || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {typeof r.total_gross === "number"
                      ? currencyEUR(r.total_gross)
                      : typeof r.total_net === "number"
                        ? currencyEUR(r.total_net)
                        : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
