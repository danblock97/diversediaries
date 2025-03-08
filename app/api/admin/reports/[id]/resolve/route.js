import { supabase } from "@/lib/supabaseServerClient";

export async function PUT(req, { params }) {
  const { id } = params;
  const { resolved_by } = await req.json();
  const { error } = await supabase
    .from("reports")
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: resolved_by,
    })
    .eq("id", id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
