"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Customer = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  title: string;
  project_number: string | null;
  status: string;
};

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [offerDate, setOfferDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentDueDays, setPaymentDueDays] = useState(7);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [discountDays, setDiscountDays] = useState<number | null>(null);
  const [taxRate, setTaxRate] = useState(19);
  const [showVatForLabor, setShowVatForLabor] = useState(false);

  // Lade Kunden
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch("/api/customers");
        if (!res.ok) throw new Error("Laden fehlgeschlagen");
        const json = await res.json();
        setCustomers(json.data ?? []);
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der Kunden");
      }
    }

    void loadCustomers();
  }, []);

  // Lade Projekte wenn Kunde ausgewählt
  useEffect(() => {
    async function loadProjects() {
      if (!customerId) {
        setProjects([]);
        return;
      }

      try {
        const res = await fetch(`/api/customers/${customerId}/projects`);
        if (!res.ok) throw new Error("Laden fehlgeschlagen");
        const json = await res.json();
        setProjects(json.data ?? []);
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der Projekte");
      }
    }

    void loadProjects();
  }, [customerId]);

  // Angebot erstellen
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Bitte wählen Sie einen Kunden aus");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          project_id: projectId || undefined,
          title: title || "Angebot",
          offer_date: offerDate,
          status: "draft",
          payment_due_days: paymentDueDays,
          discount_percent: discountPercent,
          discount_days: discountDays,
          tax_rate: taxRate,
          show_vat_for_labor: showVatForLabor,
          total_net: 0,
          total_tax: 0,
          total_gross: 0
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const json = await res.json();
      router.push(`/app/offers/${json.data.id}`);
    } catch (err) {
      console.error(err);
      setError("Fehler beim Erstellen des Angebots");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/app/offers"
              className="text-zinc-400 hover:text-zinc-600"
            >
              ←
            </Link>
            <h1 className="text-lg font-medium">Neues Angebot</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {/* Kunde & Projekt */}
            <div className="space-y-4">
              <h2 className="text-base font-medium">Kunde & Projekt</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Kunde *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                    required
                  >
                    <option value="">Bitte wählen...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Projekt
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                    disabled={!customerId}
                  >
                    <option value="">Ohne Projekt</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Angebotsdaten */}
            <div className="space-y-4">
              <h2 className="text-base font-medium">Angebotsdaten</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Titel
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Angebot"
                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Datum
                  </label>
                  <input
                    type="date"
                    value={offerDate}
                    onChange={(e) => setOfferDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Zahlungsbedingungen */}
            <div className="space-y-4">
              <h2 className="text-base font-medium">Zahlungsbedingungen</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Zahlungsziel (Tage)
                  </label>
                  <input
                    type="number"
                    value={paymentDueDays}
                    onChange={(e) => setPaymentDueDays(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Skonto (%)
                  </label>
                  <input
                    type="number"
                    value={discountPercent ?? ""}
                    onChange={(e) =>
                      setDiscountPercent(
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Skonto-Tage
                  </label>
                  <input
                    type="number"
                    value={discountDays ?? ""}
                    onChange={(e) =>
                      setDiscountDays(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Steuer */}
            <div className="space-y-4">
              <h2 className="text-base font-medium">Steuer</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Steuersatz (%)
                  </label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showVatForLabor}
                      onChange={(e) => setShowVatForLabor(e.target.checked)}
                      className="rounded border-zinc-300"
                    />
                    <span className="text-sm text-zinc-700">
                      MwSt. auf Arbeitsleistung separat ausweisen
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-zinc-200 pt-6">
              <div className="flex justify-end gap-4">
                <Link
                  href="/app/offers"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
                >
                  Abbrechen
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Wird erstellt..." : "Angebot erstellen"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
