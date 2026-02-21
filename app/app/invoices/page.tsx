const rows = [
  {
    id: "i1",
    date: "2026-02-21",
    number: "R-001",
    status: "draft",
    name: "Sanierung Rechnung",
    customer: "Musterkunde GmbH",
    amount: "1.234,00 EUR",
  },
];

export default function InvoicesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Rechnungen</h1>
        <p className="text-sm text-zinc-600">Übersicht</p>
      </div>

      <div className="rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Nummer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Kunde</th>
              <th className="px-4 py-3 font-medium">Betrag</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">{r.date}</td>
                <td className="px-4 py-3">{r.number}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">{r.customer}</td>
                <td className="px-4 py-3">{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
