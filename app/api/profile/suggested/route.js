// app/api/profile/suggested/route.js
import { supabase } from "@/lib/supabaseServerClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, profile_picture, followers")
    .neq("id", userId)
    .limit(5);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
