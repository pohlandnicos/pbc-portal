import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Customer = Database["public"]["Tables"]["customers"]["Row"];

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select(`
        id,
        company_name,
        salutation,
        first_name,
        last_name,
        type
      `)
      .order("company_name", { nullsFirst: true })
      .order("last_name", { nullsFirst: true });

    if (error) throw error;

    // Namen formatieren
    const customers = (data as Customer[]).map((c) => ({
      id: c.id,
      name:
        c.type === "company"
          ? c.company_name
          : `${c.salutation} ${c.first_name} ${c.last_name}`.trim(),
    }));

    return NextResponse.json({ data: customers });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "db_error", details: err },
      { status: 500 }
    );
  }
}
