"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectCreateDialog } from "@/components/projects/ProjectCreateDialog";

type ProjectRow = {
  id: string;
  title: string;
  project_number: string | null;
  received_at: string;
  executionLocation: string;
  customerName: string;
};

export default function ProjectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ProjectRow[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | { data?: ProjectRow[]; error?: string }
        | null;
      if (!res.ok) {
        setError("Laden fehlgeschlagen");
        return;
      }
      setRows(json?.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projekte</h1>
          <p className="text-sm text-zinc-600">Übersicht</p>
        </div>
        <ProjectCreateDialog
          onCreated={() => {
            router.refresh();
            void load();
          }}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

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
            {loading ? (
              <tr>
                <td className="px-4 py-3" colSpan={4}>
                  Laden...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-3" colSpan={4}>
                  Noch keine Projekte vorhanden.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <Link className="text-zinc-900 underline" href={`/app/projects/${r.id}`}>
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.project_number ?? ""}</td>
                  <td className="px-4 py-3">{r.executionLocation ?? ""}</td>
                  <td className="px-4 py-3">{r.customerName ?? ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
