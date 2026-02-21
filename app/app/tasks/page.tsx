const rows = [
  { id: "t1", title: "Erstkontakt", status: "open", due: "2026-03-01" },
];

export default function TasksPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Aufgaben</h1>
        <p className="text-sm text-zinc-600">Übersicht</p>
      </div>

      <div className="rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Titel</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Fällig</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">{r.title}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3">{r.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
