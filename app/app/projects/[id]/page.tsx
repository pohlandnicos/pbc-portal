import { cookies, headers } from "next/headers";
import { AddressMapEmbed } from "@/components/maps/AddressMapEmbed";

type Props = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: Props) {
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

  const res = await fetch(`${origin}/api/projects/${id}`, {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
    },
  }).catch(() => null);

  const json = (await res?.json().catch(() => null)) as
    | { data?: any; error?: string }
    | null;

  const project = res?.ok ? json?.data : null;

  const customer = project?.customer ?? null;
  const customerName = customer
    ? customer.type === "company"
      ? customer.company_name
      : `${customer.salutation ?? ""} ${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim()
    : "";

  const customerAddress = customer
    ? `${customer.billing_street} ${customer.billing_house_number}${
        customer.billing_address_extra ? `, ${customer.billing_address_extra}` : ""
      }, ${customer.billing_postal_code} ${customer.billing_city}`
    : "";

  const loc = project?.execution_location ?? null;
  const locationLabel = loc
    ? `${loc.street} ${loc.house_number}${loc.address_extra ? `, ${loc.address_extra}` : ""}, ${loc.postal_code} ${loc.city}`
    : "";

  const customerContactsRes = customer?.id
    ? await fetch(
        `${origin}/api/customer-contacts?customer_id=${encodeURIComponent(customer.id)}`,
        {
          cache: "no-store",
          headers: {
            cookie: cookieHeader,
          },
        }
      ).catch(() => null)
    : null;

  const customerContactsJson = (await customerContactsRes?.json().catch(() => null)) as
    | { data?: any[]; error?: string }
    | null;

  const customerContact = customerContactsRes?.ok
    ? (customerContactsJson?.data?.[0] ?? null)
    : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">{project?.title ?? "Projekt"}</h1>
          <div className="text-sm text-zinc-800">ID: {id}</div>
        </div>
      </div>

      {!project ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Projekt konnte nicht geladen werden.
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="space-y-6">
            <div className="rounded-xl border bg-white">
              <div className="border-b px-4 py-3 font-medium">Projektinfos</div>
              <div className="p-4 space-y-3">
                <div className="text-sm">
                  <div className="text-zinc-900">Projektnummer</div>
                  <div className="font-medium">{project?.project_number ?? "—"}</div>
                </div>
                <div className="text-sm">
                  <div className="text-zinc-900">Projektingang</div>
                  <div className="font-medium">{project?.received_at ?? "—"}</div>
                </div>
                <div className="text-sm">
                  <div className="text-zinc-900">Projektstatus</div>
                  <div className="font-medium">{project?.status ?? "—"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white">
              <div className="border-b px-4 py-3 font-medium">Kunde</div>
              <div className="p-4 space-y-3">
                <div className="text-sm">
                  <div className="text-zinc-900">Name</div>
                  <div className="font-medium">{customerName || "—"}</div>
                </div>
                <div className="text-sm">
                  <div className="text-zinc-900">Adresse</div>
                  <div className="font-medium">{customerAddress || "—"}</div>
                </div>
                <div className="text-sm">
                  <div className="text-zinc-900">Kontakt</div>
                  <div className="space-y-1">
                    <div className="text-zinc-900">
                      {(customerContact?.phone_landline ?? "").toString() || "—"}
                    </div>
                    <div className="text-zinc-900">
                      {(customerContact?.phone_mobile ?? "").toString() || "—"}
                    </div>
                    <div className="text-zinc-900">
                      {(customerContact?.email ?? "").toString() || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white">
              <div className="border-b px-4 py-3 font-medium">Ausführungsort</div>
              <div className="p-4 space-y-4">
                <div className="text-sm">
                  <div className="text-zinc-900">Adresse</div>
                  <div className="font-medium">{locationLabel || "—"}</div>
                </div>

                {locationLabel ? <AddressMapEmbed address={locationLabel} title="Ausführungsort" /> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white px-4 py-3">
              <div className="text-xs font-medium text-zinc-700">Umsatz (netto)</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">0,00 €</div>
            </div>
            <div className="rounded-xl border bg-white px-4 py-3">
              <div className="text-xs font-medium text-zinc-700">Ausgaben (netto)</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">0,00 €</div>
            </div>
            <div className="rounded-xl border bg-white px-4 py-3">
              <div className="text-xs font-medium text-zinc-700">Offener Betrag (brutto)</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">0,00 €</div>
            </div>
          </div>

          <div className="rounded-xl border bg-white">
            <div className="border-b px-4 py-3 font-medium">Angebote</div>
            <div className="p-4 text-sm text-zinc-700">Noch keine Angebote vorhanden.</div>
          </div>

          <div className="rounded-xl border bg-white">
            <div className="border-b px-4 py-3 font-medium">Rechnungen</div>
            <div className="p-4 text-sm text-zinc-700">Noch keine Rechnungen vorhanden.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
