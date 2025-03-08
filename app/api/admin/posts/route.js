import { supabase } from "@/lib/supabaseServerClient";

export async function GET() {
  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select("id, title, created_at, user_id");
  if (postsError) {
    return new Response(JSON.stringify({ error: postsError.message }), {
      status: 500,
    });
  }
  const userIds = [...new Set(postsData.map((post) => post.user_id))];
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
  const formattedPosts = postsData.map((post) => ({
    id: post.id,
    title: post.title,
    author: authorsLookup[post.user_id] || "Unknown",
    date: new Date(post.created_at).toLocaleDateString(),
  }));
  return new Response(JSON.stringify(formattedPosts), { status: 200 });
}
