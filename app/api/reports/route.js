import { supabase } from "@/lib/supabaseServerClient";

export async function POST(req) {
  try {
    const { reporter_id, post_id, reason } = await req.json();
    if (!reporter_id || !post_id || !reason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("reports")
      .insert([{ reporter_id, post_id, reason }]);
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
