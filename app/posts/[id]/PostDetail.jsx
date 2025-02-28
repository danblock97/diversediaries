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
    const [replyingTo, setReplyingTo] = useState(null);
    const [commentThreads, setCommentThreads] = useState({});

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

    // Extract fetchComments function outside useEffect
    const fetchComments = async () => {
        if (!id) return;

        try {
            // First fetch just the comments
            const { data: commentsData, error } = await supabase
                .from("comments")
                .select('*')
                .eq("post_id", id)
                .order('created_at', { ascending: false });

            if (error) throw new Error(error.message || "Failed to fetch comments");

            if (!commentsData || commentsData.length === 0) {
                setComments([]);
                setCommentThreads({});
                return;
            }

            // Get user IDs
            const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
            let profilesData = {};

            if (userIds.length > 0) {
                // Get profile information
                const { data: profiles, error: profilesError } = await supabase
                    .from("profiles")
                    .select('id, username, avatar_url')
                    .in('id', userIds);

                if (!profilesError && profiles) {
                    profiles.forEach(profile => {
                        profilesData[profile.id] = profile;
                    });
                }
            }

            // Combine data
            const commentsWithProfiles = commentsData.map(comment => {
                // Use the current user's email for their own comments
                const isCurrentUser = user && user.id === comment.user_id;
                const emailOrUsername = isCurrentUser ? user.email : null;

                return {
                    ...comment,
                    profiles: profilesData[comment.user_id]
                        ? {
                            ...profilesData[comment.user_id],
                            email: emailOrUsername
                        }
                        : {
                            username: emailOrUsername || "Anonymous",
                            avatar_url: null
                        }
                };
            });

            // Organize comments into threads
            const threads = {};
            commentsWithProfiles.forEach(comment => {
                if (comment.parent_comment_id) {
                    if (!threads[comment.parent_comment_id]) {
                        threads[comment.parent_comment_id] = { replies: [] };
                    }
                    threads[comment.parent_comment_id].replies.push(comment);
                } else {
                    if (!threads[comment.id]) {
                        threads[comment.id] = { replies: [] };
                    }
                }
            });

            setCommentThreads(threads);
            setComments(commentsWithProfiles.filter(c => !c.parent_comment_id));
        } catch (err) {
            console.error("Error fetching comments:", err.message || JSON.stringify(err));
            setComments([]);
            setCommentThreads({});
        }
    };

    // Then in your useEffect
    useEffect(() => {
        fetchComments();
    }, [id, user]);

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        if (!user) {
            alert("Please sign in to comment");
            return;
        }

        setCommentLoading(true);
        try {
            const commentData = {
                post_id: id,
                user_id: user.id,
                content: newComment.trim(),
            };

            // Add parent_comment_id if replying to a comment
            if (replyingTo) {
                commentData.parent_comment_id = replyingTo;
            }

            const { data, error } = await supabase
                .from("comments")
                .insert([commentData])
                .select();

            if (error) throw new Error(error.message);

            // Instead of manually updating the comments state,
            // just refresh comments from the database
            await fetchComments();

            setNewComment('');
            setReplyingTo(null);
        } catch (err) {
            alert("Failed to post comment. Please try again.");
        } finally {
            setCommentLoading(false);
        }
    };

    const Comment = ({ comment, isReply = false, onReply }) => {
        return (
            <div className={`bg-white rounded-lg ${isReply ? 'border-l-4 border-gray-200 pl-4' : 'shadow-sm'} p-6 mb-4`}>
                <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full overflow-hidden mr-4">
                        {comment.profiles?.avatar_url ? (
                            <img src={comment.profiles.avatar_url} alt="Commenter" className="w-full h-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                                {comment.profiles?.username?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <p className="font-medium text-gray-900">
                                    {comment.profiles?.username || comment.profiles?.email || 'Anonymous'}
                                </p>
                                <p className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="prose prose-sm max-w-none">
                            <p className="text-gray-800 whitespace-pre-line">{comment.content}</p>
                        </div>
                        <div className="mt-3">
                            <button
                                onClick={() => onReply(comment.id)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                Reply
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
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
                    {/* Author bio section */}
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
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 rounded-lg my-8">
                <h2 className="text-2xl font-bold font-serif mb-8">Comments</h2>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <textarea
                        placeholder={replyingTo ? "Write a reply..." : user ? "Write a comment..." : "Sign in to comment"}
                        className="w-full border border-gray-200 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        rows="4"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={!user}
                    />
                    <div className="mt-4 flex justify-between items-center">
                        {replyingTo && (
                            <button
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                onClick={() => setReplyingTo(null)}
                            >
                                Cancel Reply
                            </button>
                        )}
                        <button
                            className={`px-5 py-2 rounded-full font-medium ${
                                user ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            } transition`}
                            onClick={handlePostComment}
                            disabled={!user || commentLoading}
                        >
                            {commentLoading ? 'Posting...' : replyingTo ? 'Post Reply' : 'Post Comment'}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No comments yet. Be the first to comment!</p>
                        </div>
                    ) : (
                        comments.map(comment => {
                            const thread = commentThreads[comment.id];
                            return (
                                <div key={comment.id} className="comment-thread">
                                    <Comment
                                        comment={comment}
                                        onReply={(id) => {
                                            setReplyingTo(id);
                                            document.querySelector('textarea').focus();
                                        }}
                                    />
                                    {thread?.replies && thread.replies.length > 0 && (
                                        <div className="ml-12 mt-2 space-y-4">
                                            {thread.replies.map((reply, index) => (
                                                <Comment
                                                    key={`${reply.id}-${index}`}
                                                    comment={reply}
                                                    isReply={true}
                                                    onReply={(id) => {
                                                        setReplyingTo(comment.id); // Reply to the parent
                                                        document.querySelector('textarea').focus();
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </section>
        </div>
    );
}