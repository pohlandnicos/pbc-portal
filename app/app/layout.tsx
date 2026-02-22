import type { ReactNode } from "react";
import Link from "next/link";

const nav = [
  { href: "/app/app/projects", label: "Projekte" },
  { href: "/app/app/customers", label: "Kunden" },
  { href: "/app/app/offers", label: "Angebote" },
  { href: "/app/app/invoices", label: "Rechnungen" },
  { href: "/app/app/protocols", label: "Protokolle" },
  { href: "/app/app/tasks", label: "Aufgaben" },
  { href: "/app/app/settings", label: "Einstellungen" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="font-semibold">pbc portal</div>
          <nav className="flex gap-4 text-sm">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="text-zinc-700">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
