import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        id,
        title,
        project_number,
        status
      `)
      .eq("customer_id", context.params.id)
      .order("title");

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "db_error", details: err },
      { status: 500 }
    );
  }
}
