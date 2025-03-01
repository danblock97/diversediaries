import PostDetail from "./PostDetail";

export default async function PostPage({ params }) {
  const resolvedParams = await Promise.resolve(params);

  return <PostDetail id={resolvedParams.id} />;
}
