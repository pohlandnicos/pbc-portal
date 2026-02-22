import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(_request: Request, context: any) {
  const params = await Promise.resolve(context?.params);
  const id = params?.id as string | undefined;

  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        id,
        title,
        project_number,
        status
      `)
      .eq("customer_id", id)
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
