"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { FaCommentAlt } from "react-icons/fa";
import PostLikes from "@/components/PostLikes";
import LoadingAnimation from "@/components/LoadingAnimation";

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

async function fetchCommentCounts(postIds) {
  const counts = {};
  for (const id of postIds) {
    const { count, error } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);
    if (error) {
      console.error("Error fetching comment count for post", id, error.message);
      counts[id] = 0;
    } else {
      counts[id] = count || 0;
    }
  }
  return counts;
}

async function mergeProfilesWithPosts(postsData) {
  const userIds = [...new Set(postsData.map((post) => post.user_id))];
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, bio, profile_picture, followers")
    .in("id", userIds);
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError.message);
    return postsData.map((post) => ({ ...post, profile: null }));
  }
  const profilesById = {};
  profilesData.forEach((profile) => {
    profilesById[profile.id] = profile;
  });
  return postsData.map((post) => ({
    ...post,
    profile: profilesById[post.user_id] || null,
  }));
}

export default function ReadingListDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const listId = params.id;
  const [readingList, setReadingList] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

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
      // 1. Fetch reading list info using maybeSingle()
      const { data: listData, error: listError } = await supabase
        .from("reading_lists")
        .select("id, title, user_id, is_public, created_at")
        .eq("id", listId)
        .maybeSingle();

      if (listError) {
        console.error("Error fetching reading list:", listError.message);
      }

      if (!listData) {
        // If no data is returned, set loading to false and return
        setReadingList(null);
        setLoading(false);
        return;
      }

      setReadingList(listData);

      // 1a. Fetch the owner's profile using listData.user_id
      const { data: ownerData, error: ownerError } = await supabase
        .from("profiles")
        .select("display_name, profile_picture")
        .eq("id", listData.user_id)
        .single();

      if (ownerError) {
        console.error("Error fetching owner profile:", ownerError.message);
      } else {
        setOwnerProfile(ownerData);
      }

      // 2. Fetch posts in this reading list
      const { data: rlpData, error: postsError } = await supabase
        .from("reading_list_posts")
        .select("posts(*)")
        .eq("reading_list_id", listId);
      if (postsError) {
        console.error(
          "Error fetching posts from reading list:",
          postsError.message,
        );
        setLoading(false);
        return;
      }
      const rawPosts = rlpData.map((item) => item.posts);
      const postsWithProfiles = await mergeProfilesWithPosts(rawPosts);
      const postIds = postsWithProfiles.map((p) => p.id);
      const commentCounts = await fetchCommentCounts(postIds);
      const finalPosts = postsWithProfiles.map((post) => ({
        ...post,
        comment_count: commentCounts[post.id] || 0,
      }));
      setPosts(finalPosts);
      setLoading(false);
    }

    fetchReadingListData();
  }, [listId]);

  const togglePublicStatus = async () => {
    const newStatus = !readingList.is_public;
    const { error } = await supabase
      .from("reading_lists")
      .update({ is_public: newStatus })
      .eq("id", readingList.id);
    if (error) {
      console.error("Error updating public status:", error.message);
    } else {
      setReadingList((prev) => ({ ...prev, is_public: newStatus }));
    }
    setDropdownOpen(false);
  };

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

  const handleRemovePost = async (postId) => {
    const { error } = await supabase
      .from("reading_list_posts")
      .delete()
      .eq("reading_list_id", readingList.id)
      .eq("post_id", postId);
    if (error) {
      console.error("Error removing post:", error.message);
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
    setDropdownOpen(false);
  };

  if (loading) return <LoadingAnimation />;
  if (!readingList)
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-center text-3xl text-bold mb-4">
          Reading list not found. User may have set their list to private.
        </p>
        <Image
          src="/images/nodata.png"
          alt="Profile Picture"
          width={200}
          height={300}
          className="rounded-full object-cover"
        />
      </div>
    );

  // Use the owner's profile (if available) for display
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
                      e.preventDefault(); // Prevent the link's default action
                      e.stopPropagation(); // Stop event bubbling
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
                      <span>{post.comment_count}</span>
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
