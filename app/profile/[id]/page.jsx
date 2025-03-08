"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaCommentAlt } from "react-icons/fa";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useAuth } from "@/context/AuthContext";
import PostLikes from "@/components/PostLikes";
import AddToReadingListButton from "@/components/AddToReadingListButton";

// -------------------------
// Helper Functions
// -------------------------
function extractFirstImage(content) {
  if (!content) return null;
  const div = document.createElement("div");
  div.innerHTML = content;
  const img = div.querySelector("img");
  return img ? img.getAttribute("src") : null;
}

function contentPreview(htmlContent, maxLength = 400) {
  if (!htmlContent) return "";
  const text = htmlContent.replace(/<[^>]+>/g, "");
  let preview = text.trim().slice(0, maxLength);
  if (text.length > maxLength) preview += "...";
  return preview;
}

function calculateReadTime(content) {
  if (!content) return 0;
  const text = content.replace(/<[^>]+>/g, "");
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// -------------------------
// PublicProfile Component
// -------------------------
export default function PublicProfile() {
  const { id: profileId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [readingLists, setReadingLists] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch profile info from the API route (ensure URL matches your route)
  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch(`/api/profile/${profileId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (user && data.followers && data.followers.includes(user.id)) {
          setIsFollowing(true);
        }
      } else {
        console.error("Error fetching profile");
      }
      setLoading(false);
    }
    fetchProfile();
  }, [profileId, user]);

  // Fetch posts for the profile via your API route (you may already have one)
  useEffect(() => {
    async function fetchPosts() {
      const res = await fetch(`/api/posts?userId=${profileId}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        console.error("Error fetching posts");
      }
    }
    fetchPosts();
  }, [profileId]);

  // Fetch public reading lists for the profile
  useEffect(() => {
    async function fetchReadingLists() {
      const res = await fetch(`/api/reading_lists?userId=${profileId}`);
      if (res.ok) {
        const data = await res.json();
        setReadingLists(data);
      } else {
        console.error("Error fetching reading lists");
      }
    }
    fetchReadingLists();
  }, [profileId]);

  const handleFollow = async () => {
    if (!user) {
      alert("Please sign in to follow authors.");
      return;
    }
    let updatedFollowers;
    if (isFollowing) {
      updatedFollowers = profile.followers.filter((f) => f !== user.id);
    } else {
      updatedFollowers = [...(profile.followers || []), user.id];
    }
    const res = await fetch(`/api/profile/${profileId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followers: updatedFollowers }),
    });
    if (res.ok) {
      setProfile((prev) => ({ ...prev, followers: updatedFollowers }));
      setIsFollowing(!isFollowing);
    } else {
      console.error("Error updating followers");
    }
  };

  if (loading) return <LoadingAnimation />;
  if (!profile) return <p>Profile not found.</p>;

  return (
    <div className="max-w-5xl mx-auto py-12">
      {/* Profile header */}
      <div className="flex items-center space-x-4 mb-8">
        {profile.profile_picture ? (
          <img
            src={profile.profile_picture}
            alt="Profile"
            className="w-16 h-16 rounded-full"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
            {profile.display_name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          <p className="text-gray-600">{profile.bio}</p>
          <p className="text-gray-500 text-sm">
            {profile.followers?.length || 0} Followers
          </p>
        </div>
        {user && user.id !== profileId && (
          <button
            onClick={handleFollow}
            className="ml-auto bg-blue-600 text-white px-4 py-2 rounded"
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>

      {/* Posts section styled like homepage posts */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        {posts.length > 0 ? (
          posts.map((post) => {
            const imageUrl = extractFirstImage(post.content);
            const previewText = contentPreview(post.content, 400);
            const readTime = calculateReadTime(post.content);
            return (
              <Link key={post.id} href={`/posts/${post.id}`} className="block">
                <div className="flex flex-col border-b border-gray-200 pb-6 hover:bg-gray-50 transition px-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 mb-2">
                      {readTime} min read
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start mb-2">
                    <div>
                      <h2 className="text-xl font-semibold">{post.title}</h2>
                      <p className="text-gray-700 mb-2">{previewText}</p>
                      <div className="flex items-center text-sm text-gray-500 pb-2 space-x-4">
                        <span>
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-1">
                          <FaCommentAlt />
                          <span>{post.comment_count || 0}</span>
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
          })
        ) : (
          <p>No posts yet.</p>
        )}
      </div>

      {/* Reading lists section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Public Reading Lists</h2>
        {readingLists.length > 0 ? (
          readingLists.map((list) => (
            <div key={list.id} className="border p-4 rounded mb-4">
              <Link href={`/reading-lists/${list.id}`}>
                <h3 className="text-lg font-bold hover:underline">
                  {list.title}
                </h3>
              </Link>
              {list.description && (
                <p className="text-sm text-gray-600 mt-1">{list.description}</p>
              )}
            </div>
          ))
        ) : (
          <p>No public reading lists available.</p>
        )}
      </div>
    </div>
  );
}
