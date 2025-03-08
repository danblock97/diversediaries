import { supabase } from "@/lib/supabaseServerClient";

export async function GET() {
  const { data, error } = await supabase.from("categories").select("*");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  return new Response(JSON.stringify(data), { status: 200 });
}
