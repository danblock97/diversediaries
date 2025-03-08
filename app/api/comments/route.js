import { supabase } from "@/lib/supabaseServerClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const post_id = searchParams.get("post_id");
  if (!post_id) {
    return new Response(JSON.stringify({ error: "Missing post_id" }), {
      status: 400,
    });
  }

  const { data: comments, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", post_id)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  // Gather unique user IDs from comments
  const userIds = [...new Set(comments.map((comment) => comment.user_id))];
  let profilesLookup = {};
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);
    if (!profilesError && profiles) {
      profiles.forEach((profile) => {
        profilesLookup[profile.id] = profile;
      });
    }
  }

  // Attach profile data to each comment
  const commentsWithProfiles = comments.map((comment) => ({
    ...comment,
    profiles: profilesLookup[comment.user_id] || {},
  }));

  return new Response(JSON.stringify(commentsWithProfiles), { status: 200 });
}

export async function POST(req) {
  try {
    const { post_id, user_id, content, parent_comment_id } = await req.json();
    if (!post_id || !user_id || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          post_id,
          user_id,
          content,
          parent_comment_id: parent_comment_id || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
