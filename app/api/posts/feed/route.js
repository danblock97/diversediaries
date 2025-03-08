import { supabase } from "@/lib/supabaseServerClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 10;
  const category = searchParams.get("category") || null;
  const offset = (page - 1) * pageSize;
  const to = offset + pageSize - 1;

  let query = supabase
    .from("posts")
    .select("*, post_categories!inner(category_id)")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, to);

  if (category) {
    query = query.eq("post_categories.category_id", category);
  }

  const { data: postsData, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  // Merge profile data for each post
  const userIds = [...new Set(postsData.map((post) => post.user_id))];
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, bio, profile_picture, followers")
    .in("id", userIds);
  const profilesById = {};
  if (!profilesError && profilesData) {
    profilesData.forEach((profile) => {
      profilesById[profile.id] = profile;
    });
  }

  // Get comment counts for each post
  const postsWithData = await Promise.all(
    postsData.map(async (post) => {
      const { count, error: countError } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);
      return {
        ...post,
        profile: profilesById[post.user_id] || null,
        comment_count: countError ? 0 : count || 0,
      };
    }),
  );

  return new Response(JSON.stringify(postsWithData), { status: 200 });
}
