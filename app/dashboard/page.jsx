"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import PostLikes from "@/components/PostLikes";

// Utility: Calculate read time in minutes from post content.
function calculateReadTime(content) {
  if (!content) return 0;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Profile state
  const [profile, setProfile] = useState({
    display_name: "",
    email: "",
    bio: "",
    profile_picture: "",
  });
  // Posts state
  const [posts, setPosts] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // For delete confirmation modal
  const [postToDelete, setPostToDelete] = useState(null);

  // Fetch user profile
  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email, bio, profile_picture")
        .eq("id", user.id)
        .single();
      if (error) {
        console.error("Error fetching profile:", error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [user]);

  // Fetch user's posts
  useEffect(() => {
    if (!user) return;
    async function fetchPosts() {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, user_id, content, created_at")
        .eq("user_id", user.id);
      if (error) {
        console.error("Error fetching posts:", error.message);
      } else {
        setPosts(data || []);
      }
    }
    fetchPosts();
  }, [user]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Handle profile picture upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const filePath = `profile-pictures/${user.id}/${file.name}`;
    const { data, error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading image:", uploadError.message);
      setMessage("Error uploading image: " + uploadError.message);
      setUploading(false);
      return;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);
    if (!urlData) {
      console.error("Error getting public URL");
      setMessage("Error getting image URL");
      setUploading(false);
      return;
    }

    const publicURL = urlData.publicUrl;

    // Update profile picture
    setProfile((prev) => ({ ...prev, profile_picture: publicURL }));
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ profile_picture: publicURL })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile picture:", updateError.message);
      setMessage("Error updating profile picture: " + updateError.message);
    } else {
      setMessage("Profile picture updated successfully!");
    }
    setUploading(false);
  };

  // Handle profile form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
      })
      .eq("id", user.id);

    if (error) {
      setMessage("Error updating profile: " + error.message);
    } else {
      setMessage("Profile updated successfully!");
    }
    setUpdating(false);
  };

  // Open the confirmation modal for a specific post
  const openDeleteModal = (postId) => {
    setPostToDelete(postId);
  };

  // Close the confirmation modal
  const closeDeleteModal = () => {
    setPostToDelete(null);
  };

  // Confirm deletion (called from modal)
  const confirmDeletePost = async () => {
    if (!postToDelete) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postToDelete);

    if (error) {
      console.error("Error deleting post:", error.message);
      setMessage("Error deleting post: " + error.message);
      closeDeleteModal();
      return;
    }

    // Remove the deleted post from local state
    setPosts((prevPosts) =>
      prevPosts.filter((post) => post.id !== postToDelete),
    );
    closeDeleteModal();
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-12 h-screen">
      <div className="flex gap-8">
        {/* Left Column: Profile Settings */}
        <div className="w-1/3 space-y-4">
          <form onSubmit={handleSubmit}>
            {/* Profile Picture */}
            <div className="relative group flex flex-col items-center mb-4">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt="Profile Picture"
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 flex items-center justify-center">
                  No Image
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer">
                  <div className="bg-gray-700 bg-opacity-75 p-2 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-6 h-6 text-white"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 3.487a2.14 2.14 0 112.993 2.993l-9.193 9.193a4.286 4.286 0 01-1.845 1.116l-3.614.904a.75.75 0 01-.904-.904l.904-3.614a4.286 4.286 0 011.116-1.845l9.193-9.193z"
                      />
                    </svg>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Display Name */}
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

            {/* Email (read-only) */}
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
                className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block mb-1 font-semibold">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows="4"
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

        {/* Right Column: User Posts */}
        <div className="w-2/3">
          {posts.length > 0 ? (
            <div className="space-y-8">
              {posts.map((post) => {
                const readTime = calculateReadTime(post.content);
                return (
                  <div
                    key={post.id}
                    className="border-b border-gray-200 pb-6 hover:bg-gray-50 transition"
                  >
                    {/* 1st line: Display name and read time */}
                    <p className="text-sm text-gray-500">
                      {profile.display_name || "Anonymous"} • {readTime} min
                      read
                    </p>

                    {/* 2nd line: Post title */}
                    <h3 className="text-xl font-semibold mt-1 mb-2">
                      {post.title}
                    </h3>

                    {/* 3rd line: Published date */}
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>

                    {/* 4th line: Likes + Delete */}
                    <div className="flex items-center gap-4">
                      <PostLikes postId={post.id} />

                      {/* Delete button opens the modal */}
                      <button
                        onClick={() => openDeleteModal(post.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <img
                src="/images/nodata.png"
                alt="No Data"
                className="w-48 h-auto mb-4"
              />
              <p className="text-lg text-gray-500">No posts found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            {/* Modal Image */}
            <img
              src="/images/hero.png"
              alt="Confirm Deletion"
              className="w-full h-auto mb-4 rounded"
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
