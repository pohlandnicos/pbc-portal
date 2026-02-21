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

  const loc = project?.execution_location ?? null;
  const locationLabel = loc
    ? `${loc.street} ${loc.house_number}${loc.address_extra ? `, ${loc.address_extra}` : ""}, ${loc.postal_code} ${loc.city}`
    : "";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Projekt</h1>
        <p className="text-sm text-zinc-700">ID: {id}</p>
      </div>

      {!project ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Projekt konnte nicht geladen werden.
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <div className="text-sm">
              <div className="text-zinc-700">Projekttitel</div>
              <div className="font-medium">{project?.title ?? ""}</div>
            </div>
            <div className="text-sm">
              <div className="text-zinc-700">Projektnummer</div>
              <div className="font-medium">{project?.project_number ?? ""}</div>
            </div>
            <div className="text-sm">
              <div className="text-zinc-700">Eingangsdatum</div>
              <div className="font-medium">{project?.received_at ?? ""}</div>
            </div>
            <div className="text-sm">
              <div className="text-zinc-700">Kunde</div>
              <div className="font-medium">{customerName}</div>
            </div>
            <div className="text-sm">
              <div className="text-zinc-700">Ausführungsort</div>
              <div className="font-medium">{locationLabel}</div>
            </div>

            {locationLabel ? <AddressMapEmbed address={locationLabel} title="Ausführungsort" /> : null}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
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
