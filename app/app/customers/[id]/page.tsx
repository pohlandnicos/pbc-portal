type Props = { params: Promise<{ id: string }> };

const rightTables = {
  projects: [{ id: "p1", name: "Projekt A" }],
  offers: [{ id: "o1", number: "A-001", status: "draft" }],
  invoices: [{ id: "i1", number: "R-001", status: "draft" }],
};

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Kunde</h1>
        <p className="text-sm text-zinc-600">ID: {id}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <div className="text-sm">
              <div className="text-zinc-500">Name</div>
              <div className="font-medium">Musterkunde GmbH</div>
            </div>
            <div className="text-sm">
              <div className="text-zinc-500">Adresse</div>
              <div className="font-medium">Musterstraße 1, 10115 Berlin</div>
            </div>
            <div className="text-sm">
              <div className="text-zinc-500">USt-ID</div>
              <div className="font-medium">DE123456789</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white">
            <div className="border-b px-4 py-3 font-medium">Projekte</div>
            <div className="p-4 text-sm">
              {rightTables.projects.map((r) => (
                <div key={r.id}>{r.name}</div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-white">
            <div className="border-b px-4 py-3 font-medium">Angebote</div>
            <div className="p-4 text-sm space-y-1">
              {rightTables.offers.map((r) => (
                <div key={r.id}>
                  {r.number} ({r.status})
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-white">
            <div className="border-b px-4 py-3 font-medium">Rechnungen</div>
            <div className="p-4 text-sm space-y-1">
              {rightTables.invoices.map((r) => (
                <div key={r.id}>
                  {r.number} ({r.status})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
