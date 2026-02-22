import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );

  try {
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .insert({
        title: "Angebot",
        offer_date: new Date().toISOString().split("T")[0],
        status: "draft",
        total_net: 0,
        total_tax: 0,
        total_gross: 0,
        tax_rate: 19,
        payment_due_days: 7
      })
      .select()
      .single();

    if (offerError) throw offerError;

    const { error: groupError } = await supabase
      .from("offer_groups")
      .insert({
        offer_id: offer.id,
        index: 1,
        title: "Leistungen"
      });

    if (groupError) throw groupError;

    return NextResponse.redirect(
      new URL(`/app/app/offers/${offer.id}`, "https://pbc-portal.vercel.app")
    );
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.redirect(
      new URL("/app/app/offers", "https://pbc-portal.vercel.app")
    );
  }
}
