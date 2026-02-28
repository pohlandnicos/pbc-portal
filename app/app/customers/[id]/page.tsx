import { cookies, headers } from "next/headers";
import { CustomerContactSection } from "@/components/customers/CustomerContactSection";
import { AddressMapEmbed } from "@/components/maps/AddressMapEmbed";
import { ProjectStatusBadge, type ProjectStatus } from "@/components/projects/ProjectStatusSelect";

type Props = { params: Promise<{ id: string }> };

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const res = await fetch(`${origin}/api/customers/${id}`, {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
    },
  }).catch(() => null);

  const json = (await res?.json().catch(() => null)) as
    | { data?: any; error?: string }
    | null;

  const customer = res?.ok ? json?.data : null;

  const contactsRes = await fetch(
    `${origin}/api/customer-contacts?customer_id=${encodeURIComponent(id)}`,
    {
      cache: "no-store",
      headers: {
        cookie: cookieHeader,
      },
    }
  ).catch(() => null);

  const contactsJson = (await contactsRes?.json().catch(() => null)) as
    | { data?: any[]; error?: string }
    | null;

  const contact = contactsRes?.ok ? (contactsJson?.data?.[0] ?? null) : null;

  const projectsRes = await fetch(
    `${origin}/api/projects?customer_id=${encodeURIComponent(id)}`,
    {
      cache: "no-store",
      headers: {
        cookie: cookieHeader,
      },
    }
  ).catch(() => null);

  const projectsJson = (await projectsRes?.json().catch(() => null)) as
    | { data?: any[]; error?: string }
    | null;

  const projects = projectsRes?.ok ? (projectsJson?.data ?? []) : [];

  const offersRes = await fetch(
    `${origin}/api/offers?customer_id=${encodeURIComponent(id)}`,
    {
      cache: "no-store",
      headers: {
        cookie: cookieHeader,
      },
    }
  ).catch(() => null);

  const offersJson = (await offersRes?.json().catch(() => null)) as
    | { data?: any[]; error?: string; message?: string }
    | null;

  const offers = offersRes?.ok ? (offersJson?.data ?? []) : [];

  const name = customer
    ? customer.type === "company"
      ? customer.company_name
      : `${customer.salutation ?? ""} ${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim()
    : null;

  const address = customer
    ? `${customer.billing_street} ${customer.billing_house_number}${
        customer.billing_address_extra ? `, ${customer.billing_address_extra}` : ""
      }, ${customer.billing_postal_code} ${customer.billing_city}`
    : null;

  const typeLabel = customer
    ? customer.type === "company"
      ? "Firmenkunde"
      : "Privatkunde"
    : null;

  return (
    <div className="space-y-4 text-zinc-900">
      <div className="space-y-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">{name ?? "Kunde"}</h1>
          <div className="text-sm text-zinc-900">ID: {id}</div>
        </div>
      </div>

      {!customer ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Kunde konnte nicht geladen werden.
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-200 px-4 py-3 font-semibold">Kundendaten</div>
              <div className="p-4 space-y-3">
                <div className="text-sm">
                  <div className="text-xs font-medium text-zinc-700">Kundenname</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">{name ?? ""}</div>
                </div>
                <div className="text-sm">
                  <div className="text-xs font-medium text-zinc-700">Typ</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">{typeLabel ?? ""}</div>
                </div>
                <div className="text-sm">
                  <div className="text-xs font-medium text-zinc-700">Kundennummer</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">{customer?.customer_number ?? "—"}</div>
                </div>
                {customer?.description ? (
                  <div className="text-sm">
                    <div className="text-xs font-medium text-zinc-700">Beschreibung</div>
                    <div className="mt-1 text-sm font-semibold text-zinc-900 whitespace-pre-wrap">{customer.description}</div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-200 px-4 py-3 font-semibold">Rechnungsadresse</div>
              <div className="p-4 space-y-4">
                <div className="text-sm">
                  <div className="text-xs font-medium text-zinc-700">Adresse</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">{address ?? ""}</div>
                </div>

                {address ? <AddressMapEmbed address={address} title="Rechnungsadresse" /> : null}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-200 px-4 py-3 font-semibold">IDs</div>
              <div className="p-4 space-y-3">
                <div className="text-sm">
                  <div className="text-xs font-medium text-zinc-700">USt-ID</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">{customer?.vat_id ?? "—"}</div>
                </div>
                <div className="text-sm">
                  <div className="text-xs font-medium text-zinc-700">Leitweg-ID</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">{customer?.leitweg_id ?? "—"}</div>
                </div>
                <div className="text-sm">
                  <div className="text-xs font-medium text-zinc-700">Lieferantennummer</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">{customer?.supplier_number ?? "—"}</div>
                </div>
                <div className="text-sm">
                  <div className="text-xs font-medium text-zinc-700">Vendor Nummer</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">{customer?.vendor_number ?? "—"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-200 px-4 py-3 font-semibold">Kontakt</div>
              <div className="p-4">
                <CustomerContactSection customerId={id} contact={contact} />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-4 py-3 font-semibold">Projekte</div>
            <div className="p-4">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 text-left text-zinc-800">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Nr</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 font-medium">Ausführungsort</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td className="py-3" colSpan={4}>
                        Noch keine Projekte verknüpft.
                      </td>
                    </tr>
                  ) : (
                    projects.map((p: any) => (
                      <tr key={p.id} className="border-b border-zinc-200 last:border-b-0">
                        <td className="py-3 pr-3">
                          <a className="underline" href={`/app/projects/${p.id}`}>
                            {p.title}
                          </a>
                        </td>
                        <td className="py-3 pr-3">{p.project_number ?? ""}</td>
                        <td className="py-3 pr-3">
                          {p.status ? (
                            <ProjectStatusBadge status={p.status as ProjectStatus} />
                          ) : (
                            ""
                          )}
                        </td>
                        <td className="py-3">{p.executionLocation ?? ""}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-4 py-3 font-semibold">Angebote</div>
            <div className="p-4">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 text-left text-zinc-800">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Datum</th>
                    <th className="py-2 pr-3 font-medium">Nummer</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 font-medium text-right">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.length === 0 ? (
                    <tr>
                      <td className="py-3" colSpan={5}>
                        Noch keine Angebote vorhanden.
                      </td>
                    </tr>
                  ) : (
                    offers.map((o: any) => (
                      <tr key={o.id} className="border-b border-zinc-200 last:border-b-0">
                        <td className="py-3 pr-3">
                          <a className="underline" href={`/app/offers/${o.id}`}>{o.offer_date ?? ""}</a>
                        </td>
                        <td className="py-3 pr-3">{o.offer_number ?? "—"}</td>
                        <td className="py-3 pr-3">{o.status ?? ""}</td>
                        <td className="py-3 pr-3">
                          <a className="underline" href={`/app/offers/${o.id}`}>{o.title ?? ""}</a>
                        </td>
                        <td className="py-3 text-right">{typeof o.total_gross === "number" ? `${o.total_gross.toFixed(2)} €` : typeof o.total_net === "number" ? `${o.total_net.toFixed(2)} €` : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-4 py-3 font-semibold">Rechnungen</div>
            <div className="p-4 text-sm text-zinc-900">Noch keine Rechnungen vorhanden.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
