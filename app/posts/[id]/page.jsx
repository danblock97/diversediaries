"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { marked } from "marked";

export default function PostDetailPage({ params }) {
    const { id } = params;
    const { user } = useAuth();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Comment state
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    // Fetch post data
    useEffect(() => {
        async function fetchPost() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("posts")
                    .select(`
*,
    profiles(username, avatar_url),
    post_categories(categories(*))
`)
                    .eq("id", id)
                    .single();

                if (error) throw error;
                if (data) setPost(data);
            } catch (err) {
                console.error("Error fetching post:", err);
                setError("Failed to load post");
            } finally {
                setLoading(false);
            }
        }

        fetchPost();
    }, [id]);

    // Fetch comments
    useEffect(() => {
        async function fetchComments() {
            try {
                const { data, error } = await supabase
                    .from("comments")
                    .select(`
                        *,
                        profiles(username, avatar_url)
                    `)
                    .eq("post_id", id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setComments(data || []);
            } catch (err) {
                console.error("Error fetching comments:", err);
            }
        }

        fetchComments();
    }, [id]);

    // Handle posting a new comment
    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        if (!user) {
            alert("Please sign in to comment");
            return;
        }

        setCommentLoading(true);
        try {
            const { data, error } = await supabase
                .from("comments")
                .insert([
                    {
                        post_id: id,
                        user_id: user.id,
                        content: newComment.trim(),
                    }
                ])
                .select(`
                    *,
                    profiles(username, avatar_url)
                `)
                .single();

            if (error) throw error;

            // Add new comment to the list
            setComments([data, ...comments]);
            setNewComment('');
        } catch (err) {
            console.error("Error posting comment:", err);
        } finally {
            setCommentLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 flex justify-center">
                <p className="text-lg">Loading post...</p>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12">
                <p className="text-lg text-red-600">{error || "Post not found"}</p>
            </div>
        );
    }

    return (
        <article className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-5xl font-bold mb-6">{post.title}</h1>
            {post.post_categories && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {post.post_categories.map(pc => (
                        <span key={pc.categories.id} className="bg-gray-200 px-2 py-1 rounded-full text-sm">
                            {pc.categories.name}
                        </span>
                    ))}
                </div>
            )}
            <div className="mb-8">
                <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: marked(post.content) }}
                />
            </div>
            {post.image_url && (
                <div className="mb-8">
                    <Image
                        src={post.image_url}
                        alt="Post image"
                        width={800}
                        height={500}
                        className="object-cover rounded-md"
                    />
                </div>
            )}
            {/* Comments Section */}
            <section className="mt-10">
                <h2 className="text-3xl font-bold mb-4">Comments</h2>

                {/* Real comments list */}
                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="p-4 border border-gray-200 rounded">
                                <p className="text-gray-800">{comment.content}</p>
                                <p className="text-sm text-gray-500">
                                    {comment.profiles?.username || 'Anonymous'} ·
                                    {new Date(comment.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Comment Input */}
                <div className="mt-6">
                    <textarea
                        placeholder={user ? "Write a comment..." : "Sign in to comment"}
                        className="w-full border border-gray-300 p-3 rounded-md"
                        rows="4"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={!user}
                    />
                    <button
                        className={`mt-2 px-4 py-2 rounded ${
                            user ? 'bg-black text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        onClick={handlePostComment}
                        disabled={!user || commentLoading}
                    >
                        {commentLoading ? 'Posting...' : 'Post Comment'}
                    </button>
                </div>
            </section>
        </article>
    );
}