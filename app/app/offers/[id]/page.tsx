import { redirect } from "next/navigation";

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/app/offers/new?offer_id=${encodeURIComponent(id)}`);
}

