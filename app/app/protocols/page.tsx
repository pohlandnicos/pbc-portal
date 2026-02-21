const rows = [
  { id: "pr1", type: "inspection", title: "Begehung", date: "2026-02-21" },
];

export default function ProtocolsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Protokolle</h1>
        <p className="text-sm text-zinc-600">Übersicht</p>
      </div>

      <div className="rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Typ</th>
              <th className="px-4 py-3 font-medium">Titel</th>
              <th className="px-4 py-3 font-medium">Datum</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">{r.type}</td>
                <td className="px-4 py-3">{r.title}</td>
                <td className="px-4 py-3">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
