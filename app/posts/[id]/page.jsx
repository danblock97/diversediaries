import PostDetail from './PostDetail';

export default function PostPage({ params }) {
    // Simply pass the ID to the client component
    return <PostDetail id={params.id} />;
}