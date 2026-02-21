const rows = [
  {
    id: "p1",
    projectName: "Musterprojekt A",
    projectNumber: "P-001",
    executionLocation: "Berlin",
    customer: "Musterkunde GmbH",
  },
];

export default function ProjectsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Projekte</h1>
        <p className="text-sm text-zinc-600">Übersicht</p>
      </div>

      <div className="rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Projektname</th>
              <th className="px-4 py-3 font-medium">Projektnummer</th>
              <th className="px-4 py-3 font-medium">Ausführungsort</th>
              <th className="px-4 py-3 font-medium">Kunde</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">{r.projectName}</td>
                <td className="px-4 py-3">{r.projectNumber}</td>
                <td className="px-4 py-3">{r.executionLocation}</td>
                <td className="px-4 py-3">{r.customer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
