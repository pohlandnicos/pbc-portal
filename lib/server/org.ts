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
    const { data: bootstrapOrgId, error: bootstrapError } = await supabase.rpc(
      "bootstrap_current_user_org",
      { p_org_name: "Default" }
    );

    if (bootstrapError || !bootstrapOrgId) {
      return { orgId: null as string | null, userId: user.id };
    }

    return { orgId: bootstrapOrgId as string, userId: user.id };
  }

  return { orgId: data.org_id as string, userId: user.id };
}
