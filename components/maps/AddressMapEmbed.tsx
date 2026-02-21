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
  const width = 600;
  const height = 240;
  const staticSrc = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lon},red-pushpin`;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border bg-white">
      <img
        alt={title ?? "Karte"}
        src={staticSrc}
        className="h-56 w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
