"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function PublicProfile({ profileId }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [readingLists, setReadingLists] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch profile info
  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, bio, profile_picture, followers")
        .eq("id", profileId)
        .single();
      if (!error) {
        setProfile(data);
        if (user && data.followers && data.followers.includes(user.id)) {
          setIsFollowing(true);
        }
      }
      setLoading(false);
    }
    fetchProfile();
  }, [profileId, user]);

  // Fetch posts for the profile.
  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, content, created_at")
        .eq("user_id", profileId);
      if (!error) {
        setPosts(data);
      }
    }
    fetchPosts();
  }, [profileId]);

  // Fetch public reading lists for the profile.
  useEffect(() => {
    async function fetchReadingLists() {
      const { data, error } = await supabase
        .from("reading_lists")
        .select("id, title, description, is_public, created_at")
        .eq("user_id", profileId)
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      if (!error) {
        setReadingLists(data);
      }
    }
    fetchReadingLists();
  }, [profileId]);

  // Toggle follow/unfollow.
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
    const { error } = await supabase
      .from("profiles")
      .update({ followers: updatedFollowers })
      .eq("id", profileId);
    if (!error) {
      setProfile((prev) => ({ ...prev, followers: updatedFollowers }));
      setIsFollowing(!isFollowing);
    } else {
      console.error("Error updating followers:", error.message);
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (!profile) return <p>Profile not found.</p>;

  return (
    <div className="max-w-5xl mx-auto py-12">
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

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="border-b border-gray-200 pb-4 mb-4">
              <Link href={`/posts/${post.id}`}>
                <h3 className="text-lg font-bold hover:underline">
                  {post.title}
                </h3>
              </Link>
              <p className="text-sm text-gray-500">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        ) : (
          <p>No posts yet.</p>
        )}
      </div>

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
