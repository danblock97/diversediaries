import { supabase } from "@/lib/supabaseServerClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const limit = parseInt(searchParams.get("limit")) || 4;
  const offset = parseInt(searchParams.get("offset")) || 0;

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
    });
  }

  // Calculate Supabase range indices.
  const from = offset;
  const to = offset + limit - 1;

  // Fetch only the slice of rows for this page, ordered by created_at descending.
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, user_id, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}

export async function POST(req) {
  try {
    const { title, content, user_id, selectedCategories } = await req.json();
    if (
      !title ||
      !content ||
      !user_id ||
      !selectedCategories ||
      selectedCategories.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    // Insert new post into the posts table.
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert([{ title, content, user_id }])
      .select();

    if (postError || !postData || postData.length === 0) {
      return new Response(
        JSON.stringify({
          error: postError?.message || "Failed to create post",
        }),
        { status: 500 },
      );
    }
    const newPost = postData[0];

    // Insert into the post_categories table.
    const { error: pcError } = await supabase.from("post_categories").insert(
      selectedCategories.map((category_id) => ({
        post_id: newPost.id,
        category_id,
      })),
    );
    if (pcError) {
      return new Response(JSON.stringify({ error: pcError.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(newPost), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
