import { supabase } from "@/lib/supabaseServerClient";

export async function POST(req) {
  const { userId } = await req.json();
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || !data.is_admin) {
    return new Response(JSON.stringify({ isAdmin: false }), { status: 200 });
  }

  return new Response(JSON.stringify({ isAdmin: true }), { status: 200 });
}
