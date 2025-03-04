"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import LoadingAnimation from "@/components/LoadingAnimation";

export default function ReadingListsPage() {
  const { user, loading } = useAuth();
  const [readingLists, setReadingLists] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoadingLists, setIsLoadingLists] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, profile_picture")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    }

    async function fetchReadingLists() {
      setIsLoadingLists(true);
      const { data, error } = await supabase
        .from("reading_lists")
        .select(
          `
          id,
          title,
          description,
          created_at,
          reading_list_posts (
            posts (
              id,
              content,
              created_at
            )
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching reading lists:", error.message);
      } else {
        setReadingLists(data);
      }
      setIsLoadingLists(false);
    }

    fetchProfile();
    fetchReadingLists();
  }, [user]);

  // Helper to extract first image from HTML content.
  const extractFirstImage = (htmlContent) => {
    if (!htmlContent) return null;
    const div = document.createElement("div");
    div.innerHTML = htmlContent;
    const img = div.querySelector("img");
    return img ? img.getAttribute("src") : null;
  };

  const handleCreateNewList = async () => {
    const title = window.prompt("Enter a name for your new list:");
    if (!title) return;
    const { data, error } = await supabase
      .from("reading_lists")
      .insert({ user_id: user.id, title })
      .select("*")
      .single();
    if (error) {
      console.error("Error creating new reading list:", error.message);
      return;
    }
    setReadingLists((prev) => [data, ...prev]);
  };

  const handleDeleteList = async (listId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reading list?",
    );
    if (!confirmed) return;
    const { error } = await supabase
      .from("reading_lists")
      .delete()
      .eq("id", listId);
    if (error) {
      console.error("Error deleting reading list:", error.message);
    } else {
      setReadingLists((prev) => prev.filter((list) => list.id !== listId));
    }
  };

  if (loading) return <LoadingAnimation />;
  if (!user) return <p>Please sign in to view your reading lists.</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your library</h1>
        <button
          onClick={handleCreateNewList}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          New list
        </button>
      </div>

      {isLoadingLists && <LoadingAnimation />}

      {!isLoadingLists && readingLists.length === 0 && (
        <div className="text-gray-600">
          You have not created any reading lists yet.
        </div>
      )}

      <ul className="space-y-6">
        {readingLists.map((list) => {
          // Get first image from the first post in the list, if available.
          const firstPost = list.reading_list_posts?.[0]?.posts;
          const imageSrc = firstPost
            ? extractFirstImage(firstPost.content)
            : null;
          const fallbackImage = "/images/hero.png";
          const displayImage = imageSrc || fallbackImage;
          return (
            <li
              key={list.id}
              className="border border-gray-200 rounded p-4 flex items-center gap-4 justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 relative flex-shrink-0">
                  <Image
                    src={displayImage}
                    alt={list.title || "Reading List"}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div className="flex-1">
                  <Link
                    href={`/reading-lists/${list.id}`}
                    className="text-xl font-semibold hover:underline"
                  >
                    {list.title}
                  </Link>
                  {list.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {list.description}
                    </p>
                  )}
                  <div className="flex items-center mt-3">
                    {profile?.profile_picture ? (
                      <Image
                        src={profile.profile_picture}
                        alt={profile.display_name}
                        width={32}
                        height={32}
                        className="rounded-full object-cover mr-2"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                        {profile?.display_name?.[0] || "A"}
                      </div>
                    )}
                    <span className="text-sm text-gray-700 font-medium">
                      {profile?.display_name || "Anonymous"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteList(list.id)}
                className="text-red-500 hover:text-red-700"
                title="Delete this list"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2h1l.344 9.146A2 2 0 007.333 17h5.334a2 2 0 001.989-1.854L15 6h1a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm1 4a1 1 0 011 1v6a1 1 0 11-2 0V7a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
