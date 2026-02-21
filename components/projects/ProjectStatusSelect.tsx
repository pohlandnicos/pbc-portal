"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type ProjectStatus =
  | "new_project"
  | "appointment_planned"
  | "appointment_documented"
  | "offer_created"
  | "offer_accepted"
  | "invoice_created"
  | "invoice_overdue"
  | "invoice_reminded"
  | "invoice_paid";

type StatusDef = {
  value: ProjectStatus;
  label: string;
  dotClassName: string;
  badgeClassName: string;
};

const STATUSES: StatusDef[] = [
  {
    value: "new_project",
    label: "Neues Projekt",
    dotClassName: "bg-sky-500",
    badgeClassName: "bg-sky-50 text-sky-800 ring-sky-200",
  },
  {
    value: "appointment_planned",
    label: "Termin geplant",
    dotClassName: "bg-slate-500",
    badgeClassName: "bg-slate-50 text-slate-800 ring-slate-200",
  },
  {
    value: "appointment_documented",
    label: "Termin dokumentiert",
    dotClassName: "bg-amber-500",
    badgeClassName: "bg-amber-50 text-amber-900 ring-amber-200",
  },
  {
    value: "offer_created",
    label: "Angebot erstellt",
    dotClassName: "bg-sky-600",
    badgeClassName: "bg-sky-50 text-sky-900 ring-sky-200",
  },
  {
    value: "offer_accepted",
    label: "Angebot angenommen",
    dotClassName: "bg-emerald-600",
    badgeClassName: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  },
  {
    value: "invoice_created",
    label: "Rechnung angelegt",
    dotClassName: "bg-slate-500",
    badgeClassName: "bg-slate-50 text-slate-800 ring-slate-200",
  },
  {
    value: "invoice_overdue",
    label: "Rechnung überfällig",
    dotClassName: "bg-rose-600",
    badgeClassName: "bg-rose-50 text-rose-900 ring-rose-200",
  },
  {
    value: "invoice_reminded",
    label: "Rechnung angemahnt",
    dotClassName: "bg-rose-600",
    badgeClassName: "bg-rose-50 text-rose-900 ring-rose-200",
  },
  {
    value: "invoice_paid",
    label: "Rechnung bezahlt",
    dotClassName: "bg-emerald-600",
    badgeClassName: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  },
];

function getStatusDef(status: ProjectStatus | null | undefined): StatusDef {
  const found = STATUSES.find((s) => s.value === status);
  return (
    found ?? {
      value: "new_project",
      label: "Neues Projekt",
      dotClassName: "bg-sky-500",
      badgeClassName: "bg-sky-50 text-sky-800 ring-sky-200",
    }
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const s = getStatusDef(status);
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${s.badgeClassName}`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dotClassName}`} />
      {s.label}
    </span>
  );
}

export function ProjectStatusSelect({
  projectId,
  value,
}: {
  projectId: string;
  value: ProjectStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const current = getStatusDef(value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STATUSES;
    return STATUSES.filter((s) => s.label.toLowerCase().includes(q));
  }, [query]);

  async function setStatus(next: ProjectStatus) {
    if (next === value) {
      setOpen(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) return;
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${current.badgeClassName} ${saving ? "opacity-60" : ""}`}
        onClick={() => setOpen((s) => !s)}
        disabled={saving}
      >
        <span className={`h-2 w-2 rounded-full ${current.dotClassName}`} />
        {current.label}
        <span className="ml-1 text-[10px]">▾</span>
      </button>

      {open ? (
        <div className="absolute left-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-200 p-2">
            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Status suchen"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-auto p-1">
            {filtered.map((s) => {
              const active = s.value === value;
              return (
                <button
                  type="button"
                  key={s.value}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-50 ${active ? "bg-sky-50" : ""}`}
                  onClick={() => void setStatus(s.value)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.dotClassName}`} />
                    <span className="font-medium text-zinc-900">{s.label}</span>
                  </div>
                  {active ? <span className="text-sky-700">✓</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
