"use client";

import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import LoadingAnimation from "@/components/LoadingAnimation";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function ReadingListsPage() {
  const { user, loading } = useAuth();

  const { data: readingLists, error } = useSWR(
    user ? `/api/reading_lists?userId=${user.id}` : null,
    fetcher,
    {
      dedupingInterval: 60000, // Cache for 60 seconds
    },
  );

  const { data: profileData } = useSWR(
    user ? `/api/profile/${user.id}` : null,
    fetcher,
    {
      dedupingInterval: 60000, // Cache for 60 seconds
    },
  );

  if (loading || (!readingLists && !error)) return <LoadingAnimation />;
  if (!user) return <p>Please sign in to view your reading lists.</p>;

  // Helper to extract first image from HTML content.
  const extractFirstImage = (htmlContent) => {
    if (!htmlContent) return null;
    const div = document.createElement("div");
    div.innerHTML = htmlContent;
    const img = div.querySelector("img");
    return img ? img.getAttribute("src") : null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your library</h1>
        <button
          onClick={async () => {
            const title = window.prompt("Enter a name for your new list:");
            if (!title) return;
            const res = await fetch("/api/reading_lists", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: user.id, title }),
            });
            if (!res.ok) {
              const err = await res.json();
              console.error("Error creating new reading list:", err.error);
            }
          }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          New list
        </button>
      </div>

      {error && (
        <div className="text-red-500">Failed to load reading lists.</div>
      )}

      {readingLists && readingLists.length === 0 && (
        <div className="text-gray-600">
          You have not created any reading lists yet.
        </div>
      )}

      <ul className="space-y-6">
        {readingLists &&
          readingLists.map((list) => {
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
                      {profileData?.profile_picture ? (
                        <Image
                          src={profileData.profile_picture}
                          alt={profileData.display_name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover mr-2"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                          {profileData?.display_name?.[0] || "A"}
                        </div>
                      )}
                      <span className="text-sm text-gray-700 font-medium">
                        {profileData?.display_name || "Anonymous"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const confirmed = window.confirm(
                      "Are you sure you want to delete this reading list?",
                    );
                    if (!confirmed) return;
                    const res = await fetch(`/api/reading_lists/${list.id}`, {
                      method: "DELETE",
                    });
                    if (!res.ok) {
                      const err = await res.json();
                      console.error("Error deleting reading list:", err.error);
                    }
                  }}
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
