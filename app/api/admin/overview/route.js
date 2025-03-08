import { supabase } from "@/lib/supabaseServerClient";

export async function GET() {
  const { count: postsCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });
  const { count: reportsCount } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true });
  const { count: activeUsersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_banned", false);

  const result = {
    totalPosts: postsCount || 0,
    reportedItems: reportsCount || 0,
    activeUsers: activeUsersCount || 0,
  };

  return new Response(JSON.stringify(result), { status: 200 });
}
