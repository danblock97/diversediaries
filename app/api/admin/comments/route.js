import { supabase } from "@/lib/supabaseServerClient";

export async function GET() {
  const { data: commentsData, error: commentsError } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id")
    .order("created_at", { ascending: false });
  if (commentsError) {
    return new Response(JSON.stringify({ error: commentsError.message }), {
      status: 500,
    });
  }
  const userIds = [...new Set(commentsData.map((comment) => comment.user_id))];
  let authorsLookup = {};
  if (userIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    if (!profilesError && profilesData) {
      profilesData.forEach((profile) => {
        authorsLookup[profile.id] = profile.display_name;
      });
    }
  }
  const formattedComments = commentsData.map((comment) => ({
    id: comment.id,
    excerpt:
      comment.content.length > 50
        ? comment.content.slice(0, 50) + "..."
        : comment.content,
    author: authorsLookup[comment.user_id] || "Unknown",
    date: new Date(comment.created_at).toLocaleDateString(),
  }));
  return new Response(JSON.stringify(formattedComments), { status: 200 });
}
