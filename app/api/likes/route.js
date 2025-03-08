import { supabase } from "@/lib/supabaseServerClient";

// GET /api/likes?postId=...
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return new Response(JSON.stringify({ error: "Missing postId" }), {
      status: 400,
    });
  }

  const { data, error } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ count: data.length, likes: data }), {
    status: 200,
  });
}

// POST /api/likes
// Expects JSON body with: { post_id: string, user_id: string }
export async function POST(req) {
  const body = await req.json();
  const { post_id, user_id } = body;

  if (!post_id || !user_id) {
    return new Response(
      JSON.stringify({ error: "Missing post_id or user_id" }),
      { status: 400 },
    );
  }

  const { error } = await supabase.from("likes").insert([{ post_id, user_id }]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
