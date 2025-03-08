import { supabase } from "@/lib/supabaseServerClient";

export async function POST(req) {
  try {
    const { recipient_id, type, message, is_read } = await req.json();
    if (!recipient_id || !type || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("notifications")
      .insert([{ recipient_id, type, message, is_read }]);
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
