import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error: "missing_env",
          details: "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are required",
        },
        { status: 500 }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from("customers")
      .select(`
        id,
        company_name,
        salutation,
        first_name,
        last_name,
        type,
        billing_street,
        billing_house_number,
        billing_postal_code,
        billing_city
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
      street: `${c.billing_street ?? ""} ${c.billing_house_number ?? ""}`.trim(),
      zip: c.billing_postal_code ?? "",
      city: c.billing_city ?? "",
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
