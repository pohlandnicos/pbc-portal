"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/format";

const statusStyles = {
  draft: "bg-zinc-100 text-zinc-800",
  sent: "bg-sky-100 text-sky-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800"
} as const;

const statusLabels = {
  draft: "Entwurf",
  sent: "Versendet",
  accepted: "Angenommen",
  rejected: "Abgelehnt"
} as const;

type OfferStatus = keyof typeof statusLabels;

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

  function createOffer() {
    router.push('/app/offers/new');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <h1 className="text-lg font-medium">Angebote</h1>
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
                    {formatDate(offer.offer_date)}
                  </td>
                  <td className="px-4 py-3">
                    A-{String(offer.id).slice(-3)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        statusStyles[offer.status as keyof typeof statusStyles]
                      }`}
                    >
                      {statusLabels[offer.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/offers/${offer.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {offer.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {offer.customers?.type === "company"
                      ? offer.customers.company_name
                      : `${offer.customers?.salutation} ${offer.customers?.first_name} ${offer.customers?.last_name}`}
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
