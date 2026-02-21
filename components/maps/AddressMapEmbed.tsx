type Props = {
  address: string;
  title?: string;
};

export function AddressMapEmbed({ address, title }: Props) {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const src = `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&z=15&output=embed`;

  return (
    <div className="mt-3 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200">
      <iframe
        title={title ?? "Karte"}
        src={src}
        className="h-56 w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
