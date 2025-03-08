import { supabase } from "@/lib/supabaseServerClient";

export async function GET() {
  const { data, error } = await supabase
    .from("reports")
    .select("id, post_id, reason, created_at, resolved, posts(title)")
    .order("created_at", { ascending: false });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  const formattedReports = data.map((r) => ({
    id: r.id,
    title: r.posts ? r.posts.title : "Unknown",
    reason: r.reason,
    date: new Date(r.created_at).toLocaleDateString(),
    resolved: r.resolved,
  }));
  return new Response(JSON.stringify(formattedReports), { status: 200 });
}
