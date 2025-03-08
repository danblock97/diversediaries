"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { FiBookmark } from "react-icons/fi";

export default function AddToReadingListButton({ postId }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [readingLists, setReadingLists] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch the current user's reading lists from your API route.
  useEffect(() => {
    async function fetchLists() {
      if (!user) return;
      try {
        const res = await fetch(`/api/reading_lists?userId=${user.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch reading lists");
        }
        const data = await res.json();
        setReadingLists(data || []);
      } catch (error) {
        console.error("Error fetching reading lists:", error.message);
      }
    }
    fetchLists();
  }, [user]);

  // Check if this post is already in one of the user's reading lists.
  // For each list, we fetch its posts using the reading_list_posts API route.
  useEffect(() => {
    async function checkIfPostAdded() {
      if (!user || readingLists.length === 0) return;
      try {
        const listPostsArrays = await Promise.all(
          readingLists.map(async (list) => {
            const res = await fetch(
              `/api/reading_list_posts?reading_list_id=${list.id}`,
            );
            if (!res.ok) return [];
            return res.json();
          }),
        );
        // Flatten the arrays and check if any post has an id matching postId.
        const allPosts = listPostsArrays.flat();
        const isAdded = allPosts.some((post) => post.id === postId);
        setAdded(isAdded);
      } catch (error) {
        console.error("Error checking post in reading lists:", error.message);
      }
    }
    checkIfPostAdded();
  }, [user, postId, readingLists]);

  // Adds the given post to the specified reading list using your API route.
  const handleAddToList = async (listId) => {
    setLoading(true);
    try {
      // First, fetch the posts in the selected list to check if the post already exists.
      const resCheck = await fetch(
        `/api/reading_list_posts?reading_list_id=${listId}`,
      );
      if (resCheck.ok) {
        const posts = await resCheck.json();
        const exists = posts.some((post) => post.id === postId);
        if (exists) {
          setLoading(false);
          setShowDropdown(false);
          return;
        }
      }
      // Add the post to the reading list via the API route.
      const res = await fetch("/api/reading_list_posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reading_list_id: listId, post_id: postId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add post to reading list");
      }
      setAdded(true);
    } catch (error) {
      console.error("Error adding post to reading list:", error.message);
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  // Handle button click:
  // • If no reading list exists, create a default one via POST to /api/reading_lists.
  // • If one exists, add directly.
  // • If multiple exist, open a dropdown for selection.
  const handleClick = async () => {
    if (!user) {
      console.error("User must be signed in to add posts to a reading list.");
      return;
    }
    if (readingLists.length === 0) {
      try {
        const res = await fetch("/api/reading_lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            title: "Reading List",
            is_public: false,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to create reading list");
        }
        const data = await res.json();
        setReadingLists([data]);
        handleAddToList(data.id);
      } catch (error) {
        console.error("Error creating reading list:", error.message);
      }
    } else if (readingLists.length === 1) {
      handleAddToList(readingLists[0].id);
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        className="p-2 rounded hover:bg-gray-200"
        title="Add to Reading List"
      >
        <FiBookmark
          size={20}
          className={added ? "text-green-500" : "text-gray-600"}
        />
      </button>
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md z-20">
          {readingLists.map((list) => (
            <button
              key={list.id}
              onClick={() => handleAddToList(list.id)}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              {list.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
