"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/app/projects", label: "Projekte", icon: "📁" },
  { href: "/app/customers", label: "Kunden", icon: "👥" },
  { href: "/app/offers", label: "Angebote", icon: "📄" },
  { href: "/app/invoices", label: "Rechnungen", icon: "💰" },
  { href: "/app/protocols", label: "Protokolle", icon: "📋" },
  { href: "/app/tasks", label: "Aufgaben", icon: "✓" },
  { href: "/app/settings", label: "Einstellungen", icon: "⚙️" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-zinc-200">
          <div className="text-xl font-bold text-zinc-900">pbc portal</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
