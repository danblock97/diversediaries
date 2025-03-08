import { supabase } from "@/lib/supabaseServerClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
    });
  }

  // Include the related reading_list_posts and nested posts.
  const { data, error } = await supabase
    .from("reading_lists")
    .select(
      `
      id,
      title,
      description,
      is_public,
      created_at,
      reading_list_posts (
        posts (
          id,
          content,
          created_at
        )
      )
    `,
    )
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}
