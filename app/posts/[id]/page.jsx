import PostDetail from './PostDetail';

export default async function PostPage({ params }) {
    // Properly await the params object before accessing properties
    const resolvedParams = await Promise.resolve(params);

    return <PostDetail id={resolvedParams.id} />;
}