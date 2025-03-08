import { supabase } from "@/lib/supabaseServerClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const reading_list_id = searchParams.get("reading_list_id");
  if (!reading_list_id) {
    return new Response(JSON.stringify({ error: "Missing reading_list_id" }), {
      status: 400,
    });
  }
  // Fetch reading list posts with post details
  const { data: rlpData, error: postsError } = await supabase
    .from("reading_list_posts")
    .select("posts(*)")
    .eq("reading_list_id", reading_list_id);
  if (postsError) {
    return new Response(JSON.stringify({ error: postsError.message }), {
      status: 500,
    });
  }
  // Extract raw posts
  const rawPosts = rlpData.map((item) => item.posts);
  // Fetch unique profiles for posts
  const userIds = [...new Set(rawPosts.map((post) => post.user_id))];
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, bio, profile_picture, followers")
    .in("id", userIds);
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError.message);
  }
  const profilesById = {};
  profilesData.forEach((profile) => {
    profilesById[profile.id] = profile;
  });
  const postsWithProfile = rawPosts.map((post) => ({
    ...post,
    profile: profilesById[post.user_id] || null,
  }));
  return new Response(JSON.stringify(postsWithProfile), { status: 200 });
}

export async function DELETE(req) {
  try {
    const { reading_list_id, post_id } = await req.json();
    if (!reading_list_id || !post_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }
    const { error } = await supabase
      .from("reading_list_posts")
      .delete()
      .eq("reading_list_id", reading_list_id)
      .eq("post_id", post_id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
