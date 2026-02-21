import { cookies, headers } from "next/headers";
import { CustomerContactSection } from "@/components/customers/CustomerContactSection";
import { AddressMapEmbed } from "@/components/maps/AddressMapEmbed";

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
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">{name ?? "Kunde"}</h1>
          <div className="text-sm text-zinc-800">ID: {id}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white px-4 py-3">
            <div className="text-xs font-medium text-zinc-700">Typ</div>
            <div className="mt-1 text-sm font-semibold text-zinc-900">{typeLabel ?? "—"}</div>
          </div>
          <div className="rounded-xl border bg-white px-4 py-3">
            <div className="text-xs font-medium text-zinc-700">Kundennummer</div>
            <div className="mt-1 text-sm font-semibold text-zinc-900">
              {customer?.customer_number ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border bg-white px-4 py-3">
            <div className="text-xs font-medium text-zinc-700">Ort</div>
            <div className="mt-1 text-sm font-semibold text-zinc-900">
              {customer?.billing_city ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border bg-white px-4 py-3">
            <div className="text-xs font-medium text-zinc-700">Projekte</div>
            <div className="mt-1 text-sm font-semibold text-zinc-900">{projects.length}</div>
          </div>
        </div>
      </div>

      {!customer ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Kunde konnte nicht geladen werden.
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="rounded-xl border bg-white p-4 space-y-6">
            <div>
              <div className="text-sm font-medium">Kundendaten</div>
              <div className="mt-3 space-y-3">
                <div className="text-sm">
                  <div className="text-zinc-900">Kundenname</div>
                  <div className="font-medium">{name ?? ""}</div>
                </div>
                <div className="text-sm">
                  <div className="text-zinc-900">Typ</div>
                  <div className="font-medium">{typeLabel ?? ""}</div>
                </div>

                {customer?.customer_number ? (
                  <div className="text-sm">
                    <div className="text-zinc-900">Kundennummer</div>
                    <div className="font-medium">{customer.customer_number}</div>
                  </div>
                ) : null}

                {customer?.description ? (
                  <div className="text-sm">
                    <div className="text-zinc-900">Beschreibung</div>
                    <div className="font-medium whitespace-pre-wrap">{customer.description}</div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm font-medium">Rechnungsadresse</div>
              <div className="mt-3 space-y-3">
                <div className="text-sm">
                  <div className="text-zinc-900">Adresse</div>
                  <div className="font-medium">{address ?? ""}</div>
                </div>

                {address ? <AddressMapEmbed address={address} title="Rechnungsadresse" /> : null}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm font-medium">IDs</div>
              <div className="mt-3 space-y-3">
                {customer?.vat_id ? (
                  <div className="text-sm">
                    <div className="text-zinc-700">USt-ID</div>
                    <div className="font-medium">{customer.vat_id}</div>
                  </div>
                ) : null}

                {customer?.leitweg_id ? (
                  <div className="text-sm">
                    <div className="text-zinc-700">Leitweg-ID</div>
                    <div className="font-medium">{customer.leitweg_id}</div>
                  </div>
                ) : null}

                {customer?.supplier_number ? (
                  <div className="text-sm">
                    <div className="text-zinc-700">Lieferantennummer</div>
                    <div className="font-medium">{customer.supplier_number}</div>
                  </div>
                ) : null}

                {customer?.vendor_number ? (
                  <div className="text-sm">
                    <div className="text-zinc-700">Vendor Nummer</div>
                    <div className="font-medium">{customer.vendor_number}</div>
                  </div>
                ) : null}
              </div>
            </div>

            <CustomerContactSection customerId={id} contact={contact} />
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white">
            <div className="border-b px-4 py-3 font-medium">Projekte</div>
            <div className="p-4 text-sm">
              {projects.length === 0 ? (
                <div className="text-zinc-600">Noch keine Projekte verknüpft.</div>
              ) : (
                <div className="space-y-2">
                  {projects.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between gap-4">
                      <a className="underline" href={`/app/projects/${p.id}`}>
                        {p.title}
                      </a>
                      <div className="text-zinc-600">
                        {(p.project_number ?? "").toString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white">
            <div className="border-b px-4 py-3 font-medium">Angebote</div>
            <div className="p-4 text-sm text-zinc-600">Noch keine Angebote vorhanden.</div>
          </div>

          <div className="rounded-xl border bg-white">
            <div className="border-b px-4 py-3 font-medium">Rechnungen</div>
            <div className="p-4 text-sm text-zinc-600">Noch keine Rechnungen vorhanden.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
