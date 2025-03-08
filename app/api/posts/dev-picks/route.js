import { supabase } from "@/lib/supabaseServerClient";

export async function GET() {
  const { data: postsData, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(3);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  // Merge profile data
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
  const mergedPosts = postsData.map((post) => ({
    ...post,
    profile: profilesById[post.user_id] || null,
  }));
  return new Response(JSON.stringify(mergedPosts), { status: 200 });
}
