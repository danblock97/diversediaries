import { supabase } from "@/lib/supabaseServerClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ posts: [], people: [] }), {
      status: 200,
    });
  }

  // Query posts matching the title.
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, title, user_id, created_at")
    .ilike("title", `%${query}%`)
    .order("created_at", { ascending: false })
    .limit(5);

  if (postsError) {
    console.error("Search posts error:", postsError);
  }

  // Query people matching the display name.
  const { data: people, error: peopleError } = await supabase
    .from("profiles")
    .select("id, display_name, email, profile_picture")
    .ilike("display_name", `%${query}%`)
    .limit(5);

  if (peopleError) {
    console.error("Search people error:", peopleError);
  }

  return new Response(
    JSON.stringify({
      posts: posts || [],
      people: people || [],
    }),
    { status: 200 },
  );
}
