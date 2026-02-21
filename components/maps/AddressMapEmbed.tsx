type Props = {
  address: string;
  title?: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
};

export async function AddressMapEmbed({ address, title }: Props) {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    trimmed
  )}`;

  const res = await fetch(nominatimUrl, {
    headers: {
      "User-Agent": "pbc-portal/1.0",
      Accept: "application/json",
    },
    next: { revalidate: 60 * 60 * 24 },
  }).catch(() => null);

  const json = (await res?.json().catch(() => null)) as NominatimResult[] | null;
  const first = Array.isArray(json) ? json[0] : null;
  if (!first?.lat || !first?.lon) return null;

  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const zoom = 15;
  const n = 2 ** zoom;
  const xtileF = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const ytileF =
    (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;

  const xtile = Math.floor(xtileF);
  const ytile = Math.floor(ytileF);

  return (
    <div className="mt-3 overflow-hidden rounded-lg border bg-white">
      <div className="relative h-56 w-full">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {[-1, 0, 1].flatMap((dy) =>
            [-1, 0, 1].map((dx) => {
              const x = xtile + dx;
              const y = ytile + dy;
              const src = `/api/osm-tile?z=${zoom}&x=${x}&y=${y}`;
              return (
                <img
                  key={`${dx}:${dy}`}
                  alt={title ?? "Karte"}
                  src={src}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              );
            })
          )}
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-4 w-4 rounded-full bg-red-600 ring-4 ring-white" />
        </div>
      </div>
    </div>
  );
}
