"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/format";

export default function OffersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/offers");
      const json = await res.json();
      if (!res.ok) {
        setError("Laden fehlgeschlagen");
        return;
      }
      setOffers(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createOffer() {
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Angebot",
        offer_date: new Date().toISOString().split("T")[0]
      })
    });

    if (!res.ok) return;

    const json = await res.json();
    router.push(`/offers/${json.data.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Angebote</h1>
          <p className="text-sm text-zinc-700">Übersicht</p>
        </div>

        <button
          type="button"
          onClick={createOffer}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Angebot erstellen
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Titel</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Kunde</th>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium text-right">Netto</th>
              <th className="px-4 py-3 font-medium text-right">Brutto</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-3" colSpan={6}>
                  Laden...
                </td>
              </tr>
            ) : offers.length === 0 ? (
              <tr>
                <td className="px-4 py-3" colSpan={6}>
                  Noch keine Angebote vorhanden.
                </td>
              </tr>
            ) : (
              offers.map((offer) => (
                <tr
                  key={offer.id}
                  className="border-b last:border-b-0 hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/offers/${offer.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {offer.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        {
                          draft: "bg-zinc-100 text-zinc-800",
                          sent: "bg-sky-100 text-sky-800",
                          accepted: "bg-emerald-100 text-emerald-800",
                          rejected: "bg-rose-100 text-rose-800"
                        }[offer.status]
                      }`}
                    >
                      {
                        {
                          draft: "Entwurf",
                          sent: "Versendet",
                          accepted: "Angenommen",
                          rejected: "Abgelehnt"
                        }[offer.status]
                      }
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {offer.customers?.type === "company"
                      ? offer.customers.company_name
                      : `${offer.customers?.salutation} ${offer.customers?.first_name} ${offer.customers?.last_name}`}
                  </td>
                  <td className="px-4 py-3">
                    {formatDate(offer.offer_date)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {new Intl.NumberFormat("de-DE", {
                      style: "currency",
                      currency: "EUR"
                    }).format(offer.total_net)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {new Intl.NumberFormat("de-DE", {
                      style: "currency",
                      currency: "EUR"
                    }).format(offer.total_gross)}
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
