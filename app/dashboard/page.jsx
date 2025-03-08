"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaCommentAlt } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import PostLikes from "@/components/PostLikes";
import LoadingAnimation from "@/components/LoadingAnimation";
import AddToReadingListButton from "@/components/AddToReadingListButton";

// Helper: Extract first image URL from HTML content.
function extractFirstImage(content) {
  if (!content) return null;
  const div = document.createElement("div");
  div.innerHTML = content;
  const img = div.querySelector("img");
  return img ? img.getAttribute("src") : null;
}

// Helper: Generate a text preview from HTML content.
function contentPreview(htmlContent, maxLength = 400) {
  if (!htmlContent) return "";
  const text = htmlContent.replace(/<[^>]+>/g, "");
  let preview = text.trim().slice(0, maxLength);
  if (text.length > maxLength) preview += "...";
  return preview;
}

// Helper: Calculate read time from content.
function calculateReadTime(content) {
  if (!content) return 0;
  const text = content.replace(/<[^>]+>/g, "");
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Profile state.
  const [profile, setProfile] = useState({
    display_name: "",
    email: "",
    bio: "",
    profile_picture: "",
    followers: [],
  });

  // Posts state.
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [postToDelete, setPostToDelete] = useState(null);

  // ───────────────────────────────────────────────
  // 1) Fetch user profile via API route.
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch(`/api/profile/${user.id}`);
        const data = await res.json();
        if (!res.ok) {
          console.error("Error fetching profile:", data.error);
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error("Error fetching profile:", err.message);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [user]);

  // ───────────────────────────────────────────────
  // 2) Fetch ALL posts for the user (no limit).
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    async function fetchPosts() {
      try {
        // Here we pass a very high limit to load all posts.
        const res = await fetch(
          `/api/posts?userId=${user.id}&limit=1000000&offset=0`,
        );
        const data = await res.json();
        if (!res.ok) {
          console.error("Error fetching posts:", data.error);
        } else {
          setPosts(data);
        }
      } catch (err) {
        console.error("Error fetching posts:", err.message);
      }
    }
    fetchPosts();
  }, [user]);

  // ───────────────────────────────────────────────
  // 3) Profile update handler.
  // ───────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch(`/api/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: profile.display_name,
          bio: profile.bio,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setMessage("Error updating profile: " + result.error);
      } else {
        setMessage("Profile updated successfully!");
      }
    } catch (err) {
      setMessage("Error updating profile: " + err.message);
    }
    setUpdating(false);
  };

  // ───────────────────────────────────────────────
  // 4) Delete post handlers.
  // ───────────────────────────────────────────────
  const openDeleteModal = (postId) => setPostToDelete(postId);
  const closeDeleteModal = () => setPostToDelete(null);
  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      const res = await fetch(`/api/posts/${postToDelete}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        setMessage("Error deleting post: " + result.error);
        closeDeleteModal();
        return;
      }
      setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postToDelete));
      closeDeleteModal();
    } catch (err) {
      setMessage("Error deleting post: " + err.message);
      closeDeleteModal();
    }
  };

  if (loading) return <LoadingAnimation />;

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column: Profile Settings */}
        <div className="md:w-1/3 space-y-4">
          <form onSubmit={handleSubmit}>
            <div className="relative flex flex-col items-center mb-4">
              {profile.profile_picture ? (
                <Image
                  src={profile.profile_picture}
                  alt="Profile Picture"
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  No Image
                </div>
              )}
              <p className="text-sm text-gray-600">
                {profile.followers ? profile.followers.length : 0} Followers
              </p>
            </div>
            <div>
              <label
                htmlFor="display_name"
                className="block mb-1 font-semibold"
              >
                Display Name
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={profile.display_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="email" className="block mb-1 font-semibold">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profile.email}
                readOnly
                className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="bio" className="block mb-1 font-semibold">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                rows="4"
                className="w-full border border-gray-300 rounded px-3 py-2"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={updating}
              className="mt-2 bg-black text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {updating ? "Updating..." : "Update Profile"}
            </button>
            {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
          </form>
        </div>

        {/* Right Column: User Posts with Homepage Layout */}
        <div className="md:w-2/3">
          {posts.length > 0 ? (
            <div className="space-y-8">
              {posts.map((post) => {
                const imageUrl = extractFirstImage(post.content);
                const previewText = contentPreview(post.content, 400);
                return (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="block"
                  >
                    <div className="flex flex-col border-b border-gray-200 pb-6 hover:bg-gray-50 transition px-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500 mb-2">
                          {profile.display_name} ·{" "}
                          {calculateReadTime(post.content)} min read
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start mb-2">
                        <div>
                          <h2 className="text-xl font-semibold">
                            {post.title}
                          </h2>
                          <p className="text-gray-700 mb-2">{previewText}</p>
                          <div className="flex items-center text-sm text-gray-500 pb-2 space-x-4">
                            <span>
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex items-center space-x-1">
                              <FaCommentAlt />
                              <span>0</span>
                            </div>
                            <PostLikes postId={post.id} />
                            <AddToReadingListButton postId={post.id} />
                          </div>
                        </div>
                        {imageUrl && (
                          <div className="relative w-48 h-48">
                            <Image
                              src={imageUrl}
                              alt="Post Image"
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Image
                src="/images/nodata.png"
                alt="No Data"
                width={192}
                height={192}
              />
              <p className="text-lg text-gray-500">No posts found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <Image
              src="/images/hero.png"
              alt="Confirm Deletion"
              width={400}
              height={300}
              className="rounded mb-4"
            />
            <h2 className="text-xl font-semibold mb-2">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete this post? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={confirmDeletePost}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
