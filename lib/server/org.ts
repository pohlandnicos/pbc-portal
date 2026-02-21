import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentOrgId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { orgId: null as string | null, userId: null as string | null };
  }

  const { data, error } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !data?.org_id) {
    return { orgId: null as string | null, userId: user.id };
  }

  return { orgId: data.org_id as string, userId: user.id };
}
