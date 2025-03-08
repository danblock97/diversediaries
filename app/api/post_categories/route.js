import { supabase } from "@/lib/supabaseServerClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const post_id = searchParams.get("post_id");
  if (!post_id) {
    return new Response(JSON.stringify({ error: "Missing post_id" }), {
      status: 400,
    });
  }

  const { data: postCategories, error } = await supabase
    .from("post_categories")
    .select("category_id")
    .eq("post_id", post_id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  if (postCategories.length === 0) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  const categoryIds = postCategories.map((pc) => pc.category_id);
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .in("id", categoryIds);

  if (catError) {
    return new Response(JSON.stringify({ error: catError.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(categories), { status: 200 });
}

export async function POST(req) {
  try {
    const { post_id, category_ids } = await req.json();
    if (!post_id || !category_ids || !Array.isArray(category_ids)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    const insertData = category_ids.map((category_id) => ({
      post_id,
      category_id,
    }));

    const { error } = await supabase.from("post_categories").insert(insertData);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
