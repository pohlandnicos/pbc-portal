export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Einstellungen</h1>
        <p className="text-sm text-zinc-600">Verwalte deine Einstellungen.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <a
          href="/app/settings/offer-invoice"
          className="rounded-xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50 transition-colors"
        >
          <div className="text-sm font-semibold text-zinc-900">Angebot & Rechnung</div>
          <div className="mt-1 text-sm text-zinc-600">
            Nummernkreise, Zahlungsbedingungen und rechtliche Hinweise.
          </div>
        </a>

        <a
          href="/app/settings/text-layout"
          className="rounded-xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50 transition-colors"
        >
          <div className="text-sm font-semibold text-zinc-900">Texte & Layout</div>
          <div className="mt-1 text-sm text-zinc-600">
            Logo, Absenderzeile, Textvorlagen und Fußzeile.
          </div>
        </a>
      </div>
    </div>
  );
}
