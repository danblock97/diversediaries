// app/api/auth/signin/route.js
import { supabase } from "@/lib/supabaseServerClient";

export async function POST(req) {
  const { email } = await req.json();

  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
    });
  }

  try {
    // Check if the user is banned by querying the profiles table.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("email", email)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (profile?.is_banned) {
      return new Response(
        JSON.stringify({
          error:
            "Unfortunately, your account has been banned. Please contact support for more details.",
        }),
        { status: 403 },
      );
    }

    // Send the magic link using Supabase Auth.
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ message: "Magic link sent" }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
