"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import PostLikes from "@/components/PostLikes";

// CategoriesNav acts as a filter.
function CategoriesNav({ selectedCategory, onSelect }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase.from("categories").select("*");
      if (!error) {
        setCategories(data);
      } else {
        console.error("Error fetching categories:", error.message);
      }
    }
    fetchCategories();
  }, []);

  return (
    <nav className="flex items-center space-x-4 text-sm text-gray-600 mb-8">
      <button
        onClick={() => onSelect(null)}
        className={`hover:underline ${selectedCategory === null ? "font-bold" : ""}`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`hover:underline ${selectedCategory === cat.id ? "font-bold" : ""}`}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}

// Utility: Given an array of posts, fetch the corresponding profiles from the profiles table.
async function mergeProfilesWithPosts(postsData) {
  const userIds = [...new Set(postsData.map((post) => post.user_id))];

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name")
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

// PostsFeed implements infinite scroll using Intersection Observer.
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
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("posts")
      .select("*, post_categories!inner(category_id)")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (selectedCategory) {
      query = query.eq("post_categories.category_id", selectedCategory);
    }

    const { data: postsData, error: postsError } = await query;
    if (postsError) {
      console.error("Error fetching posts:", postsError.message);
    } else if (postsData) {
      const postsWithProfile = await mergeProfilesWithPosts(postsData);
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newPosts = postsWithProfile.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
      if (postsData.length < pageSize) setHasMore(false);
      else setPage((prev) => prev + 1);
    }
    fetchInProgress.current = false;
  }, [page, pageSize, selectedCategory, hasMore]);

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
        const authorName = post.profile?.display_name || "Anonymous";
        return (
          <Link key={post.id} href={`/posts/${post.id}`} className="block">
            <div className="flex flex-col border-b border-gray-200 pb-6 hover:bg-gray-50 transition">
              <p className="text-sm text-gray-500 mb-2">
                {authorName} · {calculateReadTime(post.content)} min read
              </p>
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-700 mb-2">{post.excerpt}</p>
              <p className="text-sm text-gray-500 pb-2">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
              <PostLikes postId={post.id} />
            </div>
          </Link>
        );
      })}
      {!hasMore && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <img
            src="/images/nodata.png"
            alt="No Data"
            className="w-48 h-auto mb-4"
          />
          <p className="text-lg text-gray-500">No posts found.</p>
        </div>
      )}
      <div ref={sentinelRef} />
    </div>
  );
}

function DevPicks() {
  const [devPosts, setDevPosts] = useState([]);
  const fetchInProgress = useRef(false);

  useEffect(() => {
    async function fetchRandomPosts() {
      if (fetchInProgress.current) return;
      fetchInProgress.current = true;

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(3);

      if (postsError) {
        console.error("Error fetching dev picks:", postsError.message);
      } else if (postsData) {
        const postsWithProfile = await mergeProfilesWithPosts(postsData);
        const uniquePosts = Array.from(
          new Map(postsWithProfile.map((post) => [post.id, post])).values(),
        );
        setDevPosts(uniquePosts);
      }
      fetchInProgress.current = false;
    }
    fetchRandomPosts();
  }, []);

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-3">Dev Picks</h3>
      <ul>
        {devPosts.map((post) => {
          const authorName = post.profile?.display_name || "Anonymous";
          return (
            <li key={post.id} className="mb-4">
              {/* Wrap the author name in a link to their profile */}
              <Link
                href={`/profile/${post.user_id}`}
                className="text-sm text-gray-500 mb-1 hover:underline"
              >
                {authorName}
              </Link>
              <Link href={`/posts/${post.id}`} className="hover:underline">
                <h4 className="font-bold text-lg">{post.title}</h4>
              </Link>
              <p className="text-sm text-gray-500">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// New Component: SuggestedAccounts
function SuggestedAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    async function fetchSuggestedAccounts() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email, profile_picture, followers")
        .neq("id", user?.id)
        .limit(5);
      if (!error) {
        setAccounts(data);
      } else {
        console.error("Error fetching suggested accounts:", error.message);
      }
    }
    fetchSuggestedAccounts();
  }, [user]);

  if (accounts.length === 0) return null;

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-3">Top Authors</h3>
      <ul>
        {accounts.map((account) => (
          <li key={account.id} className="flex items-center gap-4 mb-4">
            <Link href={`/profile/${account.id}`}>
              {account.profile_picture ? (
                <img
                  src={account.profile_picture}
                  alt={account.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {account.display_name.charAt(0)}
                </div>
              )}
            </Link>
            <div>
              <Link href={`/profile/${account.id}`} className="hover:underline">
                <p className="font-bold">{account.display_name}</p>
              </Link>
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

function calculateReadTime(content) {
  if (!content) return 0;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// HeroSection remains unchanged.
function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center justify-center gap-8 px-4 py-12 md:py-20 h-screen">
      <div className="md:w-1/2 md:pr-8 mt-8 md:mt-0">
        <h1 className="text-6xl md:text-7xl font-bold mb-4 leading-tight">
          Diverse Diaries
        </h1>
        <p className="text-xl md:text-xl text-gray-700 mb-6">
          Discover inspiring stories and insights.
        </p>
        <button className="bg-black text-white px-6 py-3 rounded-full">
          Start reading
        </button>
      </div>
      <div className="md:w-1/2 flex justify-center md:justify-start">
        <img src="/images/hero.png" alt="Hero" width={600} height={400} />
      </div>
    </section>
  );
}

// Main Homepage component holds the selectedCategory state.
export default function Home() {
  const { user, loading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);

  if (loading) return <p className="text-lg h-screen">Loading...</p>;
  if (!user) return <HeroSection />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
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
