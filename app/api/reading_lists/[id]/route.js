import { supabase } from "@/lib/supabaseServerClient";

export async function GET(_req, { params }) {
  const { id } = params;
  const { data, error } = await supabase
    .from("reading_lists")
    .select("id, title, user_id, is_public, created_at, description")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  return new Response(JSON.stringify(data), { status: 200 });
}

export async function PUT(req, { params }) {
  const { id } = params;
  const body = await req.json();
  const updateData = {};
  if (body.is_public !== undefined) updateData.is_public = body.is_public;
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;

  const { error } = await supabase
    .from("reading_lists")
    .update(updateData)
    .eq("id", id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function DELETE(_req, { params }) {
  const { id } = params;
  const { error } = await supabase.from("reading_lists").delete().eq("id", id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
