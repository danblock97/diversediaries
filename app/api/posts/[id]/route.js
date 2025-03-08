import { supabase } from "@/lib/supabaseServerClient";

export async function GET(req, { params }) {
  const { id } = await params;

  // Fetch the post row
  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (postError) {
    return new Response(JSON.stringify({ error: postError.message }), {
      status: 500,
    });
  }
  if (!postData) {
    return new Response(JSON.stringify({ error: "Post not found" }), {
      status: 404,
    });
  }

  // Calculate read time
  const wordCount = postData.content.split(/\s+/).length;
  const readTime = `${Math.ceil(wordCount / 200)} min read`;

  // Fetch author profile
  let authorProfile = null;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, email, bio, profile_picture")
    .eq("id", postData.user_id)
    .single();
  if (!profileError) authorProfile = profile;

  const displayName =
    authorProfile?.display_name || authorProfile?.email || "Anonymous";

  // Fetch post_categories (then categories)
  let categories = [];
  const { data: categoryData, error: catError } = await supabase
    .from("post_categories")
    .select("category_id")
    .eq("post_id", id);
  if (!catError && categoryData && categoryData.length > 0) {
    const categoryIds = categoryData.map((pc) => pc.category_id);
    const { data: categoriesData, error: catDataError } = await supabase
      .from("categories")
      .select("*")
      .in("id", categoryIds);
    if (!catDataError) {
      categories = categoriesData;
    }
  }

  const responseData = {
    ...postData,
    readTime,
    profiles: { ...authorProfile, display_name: displayName },
    post_categories: categories.map((cat) => ({ categories: cat })),
  };

  return new Response(JSON.stringify(responseData), { status: 200 });
}

export async function DELETE(req, { params }) {
  const { id } = params;
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
