"use client";

import Link from "next/link";

export default function OffersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <h1 className="text-lg font-medium">Angebote</h1>
        <Link
          href="/open/repo/offers/new"
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
            <tr>
              <td className="px-4 py-3" colSpan={6}>
                Noch keine Angebote vorhanden.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
