import React from "react";

type Props = {
  address: string;
  title?: string;
};

export function AddressMapEmbed({ address, title }: Props) {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const src = `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border bg-white">
      <iframe
        title={title ?? "Karte"}
        src={src}
        className="h-56 w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
