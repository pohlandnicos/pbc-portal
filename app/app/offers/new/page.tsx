"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; title: string }>>([]);

  // Lade Kunden
  useEffect(() => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then((json) => setCustomers(json.data ?? []));
  }, []);

  // Lade Projekte wenn Kunde ausgewählt
  useEffect(() => {
    if (!customerId) {
      setProjects([]);
      return;
    }
    fetch(`/api/customers/${customerId}/projects`)
      .then((res) => res.json())
      .then((json) => setProjects(json.data ?? []));
  }, [customerId]);

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
          title: "Angebot",
          offer_date: new Date().toISOString().split("T")[0],
          status: "draft",
          total_net: 0,
          total_tax: 0,
          total_gross: 0,
          tax_rate: 19,
          payment_due_days: 7
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

          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

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

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Wird erstellt..." : "Angebot erstellen"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
