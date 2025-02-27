"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function PostDetail({ id }) {
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [readTime, setReadTime] = useState("5 min");

    // Fetch post data with fixed field names
    useEffect(() => {
        async function fetchPost() {
            if (!id) return;

            setLoading(true);
            try {
                // Get the post
                const { data: postData, error: postError } = await supabase
                    .from("posts")
                    .select('*')
                    .eq("id", id)
                    .single();

                if (postError) throw new Error(postError.message || "Failed to fetch post");
                if (!postData) throw new Error("Post not found");

                // Calculate read time (approximately 200 words per minute)
                const wordCount = postData.content.split(/\s+/).length;
                const estimatedReadTime = Math.ceil(wordCount / 200);
                setReadTime(`${estimatedReadTime} min read`);

                // Get author profile data
                let authorProfile = null;
                try {
                    const { data: profile, error: profileError } = await supabase
                        .from("profiles")
                        .select('bio, profile_picture')
                        .eq('id', postData.user_id)
                        .single();

                    if (!profileError) authorProfile = profile;
                } catch (profileErr) {
                    console.error("Profile fetch exception:", profileErr);
                }

                // Get categories
                let categories = [];
                try {
                    const { data: categoryData } = await supabase
                        .from("post_categories")
                        .select('category_id')
                        .eq('post_id', id);

                    if (categoryData?.length > 0) {
                        const categoryIds = categoryData.map(pc => pc.category_id);
                        const { data: categoriesData } = await supabase
                            .from("categories")
                            .select('*')
                            .in('id', categoryIds);

                        categories = categoriesData || [];
                    }
                } catch (catErr) {
                    console.error("Categories fetch exception:", catErr);
                }

                // Get author's email
                let authorEmail = "Anonymous";
                if (user && user.id === postData.user_id) {
                    authorEmail = user.email;
                }

                // Combine data
                setPost({
                    ...postData,
                    profiles: {
                        ...authorProfile,
                        username: authorEmail
                    },
                    post_categories: categories.map(cat => ({
                        categories: cat
                    }))
                });

            } catch (err) {
                console.error("Error fetching post:", err);
                setError(err.message || "Failed to load post");
            } finally {
                setLoading(false);
            }
        }

        fetchPost();
    }, [id, user]);

    // Fetch comments (code remains the same)
    useEffect(() => {
        async function fetchComments() {
            // Same code as before
            if (!id) return;

            try {
                const { data: commentsData, error } = await supabase
                    .from("comments")
                    .select('*')
                    .eq("post_id", id)
                    .order('created_at', { ascending: false });

                if (error) return;

                if (commentsData && commentsData.length > 0) {
                    const userIds = [...new Set(commentsData.map(c => c.user_id))];
                    const { data: profilesData } = await supabase
                        .from("profiles")
                        .select('id, bio, profile_picture')
                        .in('id', userIds);

                    const profileMap = {};
                    if (profilesData) {
                        profilesData.forEach(p => profileMap[p.id] = p);
                    }

                    const commentsWithProfiles = commentsData.map(c => ({
                        ...c,
                        profiles: profileMap[c.user_id] ? {
                            ...profileMap[c.user_id],
                            username: user && user.id === c.user_id ? user.email : 'Anonymous',
                            avatar_url: profileMap[c.user_id].profile_picture
                        } : null
                    }));

                    setComments(commentsWithProfiles);
                } else {
                    setComments([]);
                }
            } catch (err) {
                console.error("Error fetching comments:", err);
            }
        }

        fetchComments();
    }, [id, user]);

    const handlePostComment = async () => {
        // Same code as before
        if (!newComment.trim()) return;
        if (!user) {
            alert("Please sign in to comment");
            return;
        }

        setCommentLoading(true);
        try {
            const { data, error } = await supabase
                .from("comments")
                .insert([{
                    post_id: id,
                    user_id: user.id,
                    content: newComment.trim(),
                }])
                .select();

            if (error) throw new Error(error.message);

            const { data: profileData } = await supabase
                .from("profiles")
                .select('bio, profile_picture')
                .eq('id', user.id)
                .single();

            setComments([{
                ...data[0],
                profiles: {
                    ...profileData,
                    username: user.email,
                    avatar_url: profileData?.profile_picture
                }
            }, ...comments]);

            setNewComment('');
        } catch (err) {
            alert("Failed to post comment. Please try again.");
        } finally {
            setCommentLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-pulse text-lg">Loading post...</div>
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

    // Fix image rendering in content
    const processContent = (content) => {
        if (!content) return '';
        let processed = content;

        // Simple approach - just enhance images where they are
        processed = processed.replace(/<img([^>]*)>/g,
            '<img$1 class="my-8 max-w-full h-auto rounded-lg shadow-md">');

        // Enhanced paragraphs
        processed = processed.replace(/<p>/g, '<p class="text-lg text-gray-800 mb-7 leading-relaxed font-serif">');

        // Style headings
        processed = processed.replace(/<h2>/g, '<h2 class="text-3xl font-serif font-bold mt-12 mb-6 text-gray-900">');
        processed = processed.replace(/<h3>/g, '<h3 class="text-2xl font-serif font-bold mt-10 mb-4 text-gray-900">');

        // Style other elements
        processed = processed.replace(/<a /g, '<a class="text-blue-600 underline decoration-blue-500/30 hover:decoration-blue-500" ');
        processed = processed.replace(/<blockquote>/g, '<blockquote class="border-l-4 border-gray-200 pl-4 italic my-6 text-gray-700">');
        processed = processed.replace(/<ul>/g, '<ul class="list-disc pl-6 my-6 space-y-2">');
        processed = processed.replace(/<ol>/g, '<ol class="list-decimal pl-6 my-6 space-y-2">');

        return processed;
    };

    return (
        <div className="bg-white min-h-screen">
            {/* Hero section with title */}
            <header className="py-16 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.post_categories?.map(pc => (
                            <span key={pc.categories.id} className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                                {pc.categories.name}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 leading-tight mb-4">
                        {post.title}
                    </h1>

                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 bg-gray-300 rounded-full overflow-hidden">
                            {post.profiles?.profile_picture ? (
                                <img src={post.profiles.profile_picture} alt="Author" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                                    {post.profiles?.username?.charAt(0)?.toUpperCase() || 'A'}
                                </div>
                            )}
                        </div>
                        <div className="ml-4">
                            <p className="text-base font-medium text-gray-900">{post.profiles?.username || "Anonymous"}</p>
                            <div className="flex text-sm text-gray-500 items-center">
                                <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span className="mx-1">•</span>
                                <span>{readTime}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Article content */}
            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div
                    className="article-content font-serif"
                    dangerouslySetInnerHTML={{ __html: processContent(post.content) }}
                />

                {/* First paragraph highlight for Medium style */}
                <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', () => {
            const firstP = document.querySelector('.article-content > p:first-of-type');
            if (firstP) {
                firstP.classList.add('text-xl', 'font-medium');
            }
        });
    `}} />

                <div className="border-t border-gray-200 my-12 pt-8">
                    {/* Author bio section - stays the same */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16 bg-gray-300 rounded-full overflow-hidden">
                            {post.profiles?.profile_picture ? (
                                <img src={post.profiles.profile_picture} alt="Author" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500 text-xl">
                                    {post.profiles?.username?.charAt(0)?.toUpperCase() || 'A'}
                                </div>
                            )}
                        </div>
                        <div className="ml-4">
                            <p className="text-lg font-medium text-gray-900">{post.profiles?.username || "Anonymous"}</p>
                            <p className="text-gray-600 mt-1">{post.profiles?.bio || "Writer at Diverse Diaries"}</p>
                        </div>
                    </div>
                </div>
            </article>

            {/* Comments section */}
            <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 rounded-lg my-8">
                <h2 className="text-2xl font-bold font-serif mb-8">Comments</h2>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <textarea
                        placeholder={user ? "Write a comment..." : "Sign in to comment"}
                        className="w-full border border-gray-200 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        rows="4"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={!user}
                    />
                    <div className="mt-4 flex justify-end">
                        <button
                            className={`px-5 py-2 rounded-full font-medium ${
                                user ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            } transition`}
                            onClick={handlePostComment}
                            disabled={!user || commentLoading}
                        >
                            {commentLoading ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No comments yet. Be the first to comment!</p>
                        </div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="bg-white p-6 rounded-lg shadow-sm">
                                <p className="text-gray-800 leading-relaxed">{comment.content}</p>
                                <div className="flex items-center mt-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
                                        {comment.profiles?.avatar_url ? (
                                            <img src={comment.profiles.avatar_url} alt="Commenter" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                                                {comment.profiles?.username?.charAt(0)?.toUpperCase() || 'A'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900">{comment.profiles?.username || 'Anonymous'}</p>
                                        <p className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}