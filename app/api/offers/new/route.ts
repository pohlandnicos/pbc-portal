import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll() {},
      },
    }
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

    return NextResponse.json({ data: { id: offer.id } }, { status: 200 });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 }
    );
  }
}
