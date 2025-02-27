// app/dashboard/new/PostDetail.jsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import FeedbackModal from "@/components/FeedbackModal";

// Dynamically import TipTap to avoid SSR issues
const TiptapEditor = dynamic(() => import("@/components/TiptapEditor"), {
    ssr: false,
    loading: () => <p>Loading Editor...</p>,
});

export default function NewPostPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // Local state for the form.
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [loadingPost, setLoadingPost] = useState(false);
    const [error, setError] = useState("");
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [newPostId, setNewPostId] = useState(null);

    // Always fetch categories regardless.
    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase.from("categories").select("*");
            if (error) {
                console.error("Error fetching categories:", error.message);
            } else {
                setCategories(data);
            }
        };
        fetchCategories();
    }, []);

    // Redirect if not authenticated (but only do this after loading is finished).
    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
    }, [loading, user, router]);

    const handleCategoryChange = (categoryId) => {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
        } else {
            setSelectedCategories([...selectedCategories, categoryId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!title.trim() || !content.trim()) {
            setError("Title and content are required.");
            return;
        }
        if (selectedCategories.length === 0) {
            setError("Please select at least one category.");
            return;
        }

        setLoadingPost(true);

        // Insert new post into the posts table.
        const { data: postData, error: postError } = await supabase
            .from("posts")
            .insert([{ title, content, user_id: user.id }])
            .select();

        if (postError || !postData || postData.length === 0) {
            setError(postError?.message || "Failed to create post");
            setLoadingPost(false);
            return;
        }

        const newPost = postData[0];
        setNewPostId(newPost.id);

        // Insert into the post_categories table.
        const insertPromises = selectedCategories.map((categoryId) =>
            supabase.from("post_categories").insert([{ post_id: newPost.id, category_id: categoryId }])
        );
        const results = await Promise.all(insertPromises);
        const anyError = results.find((res) => res.error);
        if (anyError) {
            setError(anyError.error.message);
            setLoadingPost(false);
            return;
        }

        // Check if "Other" category is selected.
        const otherCategory = categories.find((cat) => cat.name.toLowerCase() === "other");
        if (otherCategory && selectedCategories.includes(otherCategory.id)) {
            setFeedbackModalOpen(true);
        } else {
            router.push(`/posts/${newPost.id}`);
        }
        setLoadingPost(false);
    };

    const handleFeedbackSubmitted = () => {
        router.push(`/posts/${newPostId}`);
    };

    // Render the same hook structure and conditionally show content.
    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            {loading ? (
                <div className="flex items-center justify-center h-screen">
                    <p className="text-lg">Loading...</p>
                </div>
            ) : (
                <>
                    <h1 className="text-4xl font-bold mb-8">Create New Post</h1>
                    {error && <div className="mb-4 text-red-600 text-sm">Error: {error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-lg font-medium mb-2" htmlFor="title">
                                Title
                            </label>
                            <input
                                id="title"
                                type="text"
                                placeholder="Post Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-gray-300 p-3 rounded-md text-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-lg font-medium mb-2" htmlFor="content">
                                Content
                            </label>
                            <TiptapEditor value={content} onChange={setContent} />
                        </div>
                        <div>
                            <label className="block text-lg font-medium mb-2">
                                Categories (select at least one)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <label key={cat.id} className="flex items-center space-x-1">
                                        <input
                                            type="checkbox"
                                            value={cat.id}
                                            checked={selectedCategories.includes(cat.id)}
                                            onChange={() => handleCategoryChange(cat.id)}
                                            className="h-4 w-4"
                                        />
                                        <span className="text-sm">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loadingPost}
                            className="bg-black text-white px-6 py-3 rounded-full disabled:opacity-50"
                        >
                            {loadingPost ? "Publishing..." : "Publish"}
                        </button>
                    </form>

                    {/* Feedback Modal for "Other" Category */}
                    <FeedbackModal
                        isOpen={feedbackModalOpen}
                        onClose={() => setFeedbackModalOpen(false)}
                        onFeedbackSubmitted={handleFeedbackSubmitted}
                    />
                </>
            )}
        </div>
    );
}