import { supabase } from "@/lib/supabaseServerClient";

export async function PUT(req, { params }) {
  const { id } = params;
  const { action } = await req.json();
  const isBanned = action === "ban";
  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: isBanned })
    .eq("id", id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
