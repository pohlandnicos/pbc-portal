import type { ReactNode } from "react";
import Link from "next/link";

const nav = [
  { href: "/app/projects", label: "Projekte" },
  { href: "/app/customers", label: "Kunden" },
  { href: "/app/offers", label: "Angebote" },
  { href: "/app/invoices", label: "Rechnungen" },
  { href: "/app/protocols", label: "Protokolle" },
  { href: "/app/tasks", label: "Aufgaben" },
  { href: "/app/settings", label: "Einstellungen" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="border-b bg-white">
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
