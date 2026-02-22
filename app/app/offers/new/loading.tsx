export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h1 className="text-lg font-medium mb-4">Angebot wird erstellt...</h1>
          <p className="text-sm text-zinc-600">
            Einen Moment bitte, das neue Angebot wird vorbereitet.
          </p>
        </div>
      </div>
    </div>
  );
}
