import { supabase } from "@/lib/supabaseServerClient";

export async function POST(req) {
  const body = await req.json();

  // Validate required fields
  if (!body.feedback || !body.user_id) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  const { error } = await supabase.from("feedback").insert([
    {
      feedback: body.feedback,
      user_id: body.user_id,
      email: body.email || null,
      display_name: body.display_name || null,
    },
  ]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
