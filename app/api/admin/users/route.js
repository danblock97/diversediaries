import { supabase } from "@/lib/supabaseServerClient";

export async function GET() {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  const formattedUsers = data.map((u) => ({
    id: u.id,
    name: u.display_name || "No name",
    email: u.email || "No email",
    is_banned: u.is_banned ?? false,
  }));
  return new Response(JSON.stringify(formattedUsers), { status: 200 });
}
