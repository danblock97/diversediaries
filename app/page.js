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
// Now we only include display_name along with id.
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
      // Merge profile data to get display_name for each post.
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
        // Now fetch display_name from the profile data instead of using user.email.
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
        <div className="py-8 text-center text-gray-500">
          <p>
            No posts found in this category. Try another filter or check back
            later!
          </p>
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
        // Merge profile data to fetch display_name for each dev pick.
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
    <div className="p-4 border border-gray-200 rounded">
      <h3 className="text-lg font-bold mb-3">Dev Picks</h3>
      <ul>
        {devPosts.map((post) => {
          // Use display_name from the profile for the dev pick as well.
          const authorName = post.profile?.display_name || "Anonymous";
          return (
            <li key={post.id} className="mb-4">
              <p className="text-sm text-gray-500 mb-1">{authorName}</p>
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
        </div>
      </div>
    </div>
  );
}
