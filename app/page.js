"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaCommentAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PostLikes from "@/components/PostLikes";
import LoadingAnimation from "@/components/LoadingAnimation";
import AddToReadingListButton from "@/components/AddToReadingListButton";

// -------------------------
// CategoriesNav Component
// -------------------------
function CategoriesNav({ selectedCategory, onSelect }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        // Ensure data is an array
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching categories:", error.message);
      }
    }
    fetchCategories();
  }, []);

  return (
    <nav className="overflow-x-auto whitespace-nowrap flex items-center space-x-4 text-sm text-gray-600 mb-8 px-2">
      <button
        onClick={() => onSelect(null)}
        className={`hover:underline flex-shrink-0 ${selectedCategory === null ? "font-bold" : ""}`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`hover:underline flex-shrink-0 ${selectedCategory === cat.id ? "font-bold" : ""}`}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}

// -------------------------
// Client-side Helper Functions
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
// AuthorTooltip Component
// -------------------------
function AuthorTooltip({ profile }) {
  const router = useRouter();
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    if (user && profile && profile.followers) {
      setIsFollowing(profile.followers.includes(user.id));
    }
  }, [user, profile]);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setShow(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => setShow(false), 200);
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/profile/${profile?.id}`);
  };

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !profile) {
      alert("Please sign in to follow authors.");
      return;
    }
    let updatedFollowers;
    if (isFollowing) {
      updatedFollowers = profile.followers.filter((f) => f !== user.id);
    } else {
      updatedFollowers = [...(profile.followers || []), user.id];
    }
    try {
      const res = await fetch(`/api/profile/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followers: updatedFollowers }),
      });
      if (!res.ok) throw new Error("Failed to update followers");
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error updating followers:", error.message);
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => e.stopPropagation()}
    >
      <span onClick={handleProfileClick} className="underline cursor-pointer">
        {profile?.display_name || "Anonymous"}
      </span>
      {show && profile && (
        <div
          className="absolute top-full left-0 mt-2 w-64 p-4 bg-white border border-gray-200 rounded shadow-lg z-50"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center mb-2">
            {profile.profile_picture ? (
              <Image
                src={profile.profile_picture}
                alt={profile.display_name}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                {profile.display_name ? profile.display_name.charAt(0) : "A"}
              </div>
            )}
            <span className="ml-2 font-bold">{profile.display_name}</span>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            {profile.followers ? profile.followers.length : 0} Followers
          </div>
          {profile.bio && (
            <div className="text-sm text-gray-600 mb-2">{profile.bio}</div>
          )}
          <button
            className="px-4 py-1 text-sm rounded bg-black text-white"
            onClick={handleFollow}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
        </div>
      )}
    </div>
  );
}

// -------------------------
// PostsFeed Component
// -------------------------
function PostsFeed({ selectedCategory }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;
  const observerRef = useRef();
  const fetchInProgress = useRef(false);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, [selectedCategory]);

  const fetchPosts = useCallback(async () => {
    if (fetchInProgress.current || !hasMore) return;
    fetchInProgress.current = true;
    const query = `/api/posts/feed?category=${selectedCategory || ""}&page=${page}`;
    try {
      const res = await fetch(query);
      const postsData = await res.json();
      // Ensure postsData is an array
      const newPosts = Array.isArray(postsData) ? postsData : [];
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const filtered = newPosts.filter((p) => !existingIds.has(p.id));
        return [...prev, ...filtered];
      });
      if (newPosts.length < pageSize) setHasMore(false);
      else setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Error fetching posts:", error.message);
    }
    fetchInProgress.current = false;
  }, [page, selectedCategory, hasMore]);

  const sentinelRef = useCallback(
    (node) => {
      if (fetchInProgress.current) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchPosts();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [fetchPosts, hasMore],
  );

  return (
    <div>
      {posts.map((post) => {
        const imageUrl = extractFirstImage(post.content);
        const previewText = contentPreview(post.content, 400);
        return (
          <Link key={post.id} href={`/posts/${post.id}`} className="block">
            <div className="flex flex-col border-b border-gray-200 pb-6 hover:bg-gray-50 transition px-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 mb-2">
                  <AuthorTooltip profile={post.profile} /> ·{" "}
                  {calculateReadTime(post.content)} min read
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
                      <span>{post.comment_count}</span>
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
      <div ref={sentinelRef} />
    </div>
  );
}

// -------------------------
// DevPicks Component
// -------------------------
function DevPicks() {
  const [devPosts, setDevPosts] = useState([]);

  useEffect(() => {
    async function fetchDevPosts() {
      try {
        // Note: using "/api/posts/dev-picks" (with a hyphen) to avoid dynamic route conflicts
        const res = await fetch("/api/posts/dev-picks");
        const postsData = await res.json();
        if (postsData.error) {
          console.error("Error fetching dev picks:", postsData.error);
          setDevPosts([]);
        } else if (Array.isArray(postsData)) {
          setDevPosts(postsData);
        } else {
          setDevPosts([]);
        }
      } catch (error) {
        console.error("Error fetching dev picks:", error.message);
        setDevPosts([]);
      }
    }
    fetchDevPosts();
  }, []);

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-3">Dev Picks</h3>
      <ul>
        {devPosts.map((post) => (
          <li key={post.id} className="mb-4">
            <div
              className="text-sm text-gray-500 mb-1 hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/profile/${post.user_id}`;
              }}
            >
              <AuthorTooltip profile={post.profile} />
            </div>
            <Link href={`/posts/${post.id}`} className="hover:underline">
              <h4 className="font-bold text-lg">{post.title}</h4>
            </Link>
            <p className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -------------------------
// SuggestedAccounts Component
// -------------------------
function SuggestedAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    async function fetchSuggestedAccounts() {
      if (!user) return;
      try {
        const res = await fetch(`/api/profile/suggested?userId=${user.id}`);
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setAccounts(Array.isArray(data) ? data : []);
        } else {
          console.error("Expected JSON response but got HTML");
          setAccounts([]);
        }
      } catch (error) {
        console.error("Error fetching suggested accounts:", error.message);
        setAccounts([]);
      }
    }
    fetchSuggestedAccounts();
  }, [user]);

  if (!accounts || accounts.length === 0) return null;

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-3">Top Authors</h3>
      <ul>
        {accounts.map((account) => (
          <li key={account.id} className="flex items-center gap-4 mb-4">
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/profile/${account.id}`;
              }}
            >
              {account.profile_picture ? (
                <Image
                  src={account.profile_picture}
                  alt={account.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                  width={40}
                  height={40}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {account.display_name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div
                className="hover:underline cursor-pointer font-bold"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/profile/${account.id}`;
                }}
              >
                {account.display_name}
              </div>
              <p className="text-sm text-gray-500">{account.email}</p>
              <p className="text-sm text-gray-500">
                {account.followers ? account.followers.length : 0} Followers
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -------------------------
// HeroSection Component
// -------------------------
function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center justify-center gap-8 px-4 py-12 md:py-20 h-screen">
      <div className="md:w-1/2 md:pr-8 mt-8 md:mt-0">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
          Diverse Diaries
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-6">
          Discover inspiring stories and insights.
        </p>
        <button className="bg-black text-white px-6 py-3 rounded-full">
          Start reading
        </button>
      </div>
      <div className="md:w-1/2 flex justify-center md:justify-start">
        <Image src="/images/hero.png" alt="Hero" width={600} height={400} />
      </div>
    </section>
  );
}

// -------------------------
// Main Home Component
// -------------------------
export default function Home() {
  const { user, loading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);

  if (loading) return <LoadingAnimation />;
  if (!user) return <HeroSection />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen overflow-x-hidden">
      <CategoriesNav
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-2/3 space-y-8">
          <PostsFeed selectedCategory={selectedCategory} />
        </div>
        <div className="md:w-1/3 space-y-6">
          <DevPicks />
          <hr className="border-t border-gray-200" />
          <SuggestedAccounts />
        </div>
      </div>
    </div>
  );
}
