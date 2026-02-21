const rows = [
  {
    id: "c1",
    customerName: "Musterkunde GmbH",
    addressExtra: "",
    projectsCount: 1,
  },
];

export default function CustomersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Kunden</h1>
        <p className="text-sm text-zinc-600">Übersicht</p>
      </div>

      <div className="rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Kundenname</th>
              <th className="px-4 py-3 font-medium">Adresszusatz</th>
              <th className="px-4 py-3 font-medium">Anzahl Projekte</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">{r.customerName}</td>
                <td className="px-4 py-3">{r.addressExtra}</td>
                <td className="px-4 py-3">{r.projectsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
