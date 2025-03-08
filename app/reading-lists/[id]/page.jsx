"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { FaCommentAlt } from "react-icons/fa";
import PostLikes from "@/components/PostLikes";
import LoadingAnimation from "@/components/LoadingAnimation";

// Helper functions (extracted from your previous code)
function extractFirstImage(htmlContent) {
  if (!htmlContent) return null;
  const div = document.createElement("div");
  div.innerHTML = htmlContent;
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

export default function ReadingListDetailPage() {
  const { id: listId } = useParams();
  const { user } = useAuth();
  const [readingList, setReadingList] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchReadingListData() {
      setLoading(true);
      // 1. Fetch reading list info via API route
      const resList = await fetch(`/api/reading_lists/${listId}`);
      if (!resList.ok) {
        console.error("Error fetching reading list");
        setLoading(false);
        return;
      }
      const listData = await resList.json();
      if (!listData) {
        setReadingList(null);
        setLoading(false);
        return;
      }
      setReadingList(listData);

      // 1a. Fetch the owner's profile using API route for profile
      const resOwner = await fetch(`/api/profile/${listData.user_id}`);
      if (resOwner.ok) {
        const ownerData = await resOwner.json();
        setOwnerProfile(ownerData);
      } else {
        console.error("Error fetching owner profile");
      }

      // 2. Fetch posts in this reading list via API route
      const resPosts = await fetch(
        `/api/reading_list_posts?reading_list_id=${listId}`,
      );
      if (resPosts.ok) {
        const postsData = await resPosts.json();
        // postsData is expected to be an array of post objects including profile info.
        // If comment counts are not provided, you can add extra processing here.
        setPosts(postsData);
      } else {
        console.error("Error fetching posts from reading list");
      }
      setLoading(false);
    }
    fetchReadingListData();
  }, [listId]);

  // Toggle public status using API route (PUT to /api/reading_list/[id])
  const togglePublicStatus = async () => {
    const newStatus = !readingList.is_public;
    const res = await fetch(`/api/reading_lists/${readingList.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public: newStatus }),
    });
    if (!res.ok) {
      console.error("Error updating public status");
    } else {
      setReadingList((prev) => ({ ...prev, is_public: newStatus }));
    }
    setDropdownOpen(false);
  };

  // Copy current URL to clipboard
  const handleCopyURL = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      console.error("Failed to copy URL", err);
    }
    setDropdownOpen(false);
  };

  // Remove a post from the reading list via API route (DELETE to /api/reading_list_posts)
  const handleRemovePost = async (postId) => {
    const res = await fetch(`/api/reading_list_posts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reading_list_id: readingList.id,
        post_id: postId,
      }),
    });
    if (!res.ok) {
      console.error("Error removing post from reading list");
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
    setDropdownOpen(false);
  };

  if (loading) return <LoadingAnimation />;
  if (!readingList)
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-center text-3xl font-bold mb-4">
          Reading list not found. User may have set their list to private.
        </p>
        <Image
          src="/images/nodata.png"
          alt="No data"
          width={200}
          height={300}
          className="rounded-full object-cover"
        />
      </div>
    );

  const displayName = ownerProfile?.display_name || "Anonymous";
  const profilePic = ownerProfile?.profile_picture || "/images/hero.png";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative h-screen">
      {/* Owner and List Info */}
      <div className="flex items-center mb-4">
        <Image
          src={profilePic}
          alt="Owner Avatar"
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
        <div className="ml-3">
          <p className="font-bold text-md">{displayName}</p>
          <p className="text-sm text-gray-500">
            {posts.length} {posts.length === 1 ? "story" : "stories"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6 relative">
        <h1 className="text-2xl font-bold">{readingList.title}</h1>
      </div>
      {/* Posts List */}
      {posts.map((post) => {
        const imageUrl = extractFirstImage(post.content);
        const previewText = contentPreview(post.content, 400);
        return (
          <Link key={post.id} href={`/posts/${post.id}`} className="block">
            <div className="block border-b border-gray-200 pb-6 hover:bg-gray-50 transition px-2">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-500">
                  {post.profile?.display_name || "Anonymous"} ·{" "}
                  {calculateReadTime(post.content)} min read
                </div>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDropdownOpen((prev) => !prev);
                    }}
                    className="px-3 py-1"
                    title="More actions"
                  >
                    ...
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded shadow-md z-10">
                      {/* Owner-only options */}
                      {user && user.id === readingList.user_id && (
                        <>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              togglePublicStatus();
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                          >
                            {readingList.is_public
                              ? "Make Private"
                              : "Make Public"}
                          </button>
                        </>
                      )}

                      {/* Public option: Copy URL */}
                      {readingList.is_public && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCopyURL();
                          }}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          {copySuccess ? copySuccess : "Copy URL"}
                        </button>
                      )}

                      {/* Owner-only: Remove Post Options */}
                      {user && user.id === readingList.user_id && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          {posts.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto">
                              {posts.map((post) => (
                                <button
                                  key={post.id}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemovePost(post.id);
                                  }}
                                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                  Remove Post
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="px-4 py-2 text-sm text-gray-500">
                              No posts available.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
                <div>
                  <h2 className="text-xl font-semibold">{post.title}</h2>
                  <p className="text-gray-700 mb-2">{previewText}</p>
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <span>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-1">
                      <FaCommentAlt />
                      <span>{post.comment_count || 0}</span>
                    </div>
                    <PostLikes postId={post.id} />
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
  );
}
