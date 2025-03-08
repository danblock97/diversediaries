import { supabase } from "@/lib/supabaseServerClient";

export async function DELETE(_req, { params }) {
  const { id } = params;
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
