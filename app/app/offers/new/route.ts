import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { orgId } = await getCurrentOrgId();
    if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

    // Create offer
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .insert({
        org_id: orgId,
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

    if (offerError) {
      console.error('Database error:', offerError);
      return NextResponse.redirect(new URL("/app/app/offers", request.url));
    }

    // Create first group
    const { error: groupError } = await supabase
      .from("offer_groups")
      .insert({
        org_id: orgId,
        offer_id: offer.id,
        index: 1,
        title: "Leistungen"
      });

    if (groupError) {
      console.error('Database error:', groupError);
      return NextResponse.redirect(new URL("/app/app/offers", request.url));
    }

    // Redirect to editor
    return NextResponse.redirect(new URL(`/app/app/offers/${offer.id}`, request.url));
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.redirect(new URL("/app/app/offers", request.url));
  }
}
