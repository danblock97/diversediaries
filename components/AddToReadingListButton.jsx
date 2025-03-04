"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { FiBookmark } from "react-icons/fi";

export default function AddToReadingListButton({ postId }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [readingLists, setReadingLists] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch the current user's reading lists
  useEffect(() => {
    async function fetchLists() {
      if (!user) return;
      const { data, error } = await supabase
        .from("reading_lists")
        .select("*")
        .eq("user_id", user.id);
      if (!error) {
        setReadingLists(data || []);
      } else {
        console.error("Error fetching reading lists:", error.message);
      }
    }
    fetchLists();
  }, [user]);

  // Check if this post is already in one of the user's reading lists
  useEffect(() => {
    async function checkIfPostAdded() {
      if (!user || readingLists.length === 0) return;
      const { data, error } = await supabase
        .from("reading_list_posts")
        .select("reading_list_id")
        .eq("post_id", postId);
      if (error) {
        console.error("Error checking post in reading lists:", error.message);
        return;
      }
      if (data && data.length > 0) {
        const isAdded = data.some((row) =>
          readingLists.some((list) => list.id === row.reading_list_id),
        );
        setAdded(isAdded);
      }
    }
    checkIfPostAdded();
  }, [user, postId, readingLists]);

  const handleAddToList = async (listId) => {
    setLoading(true);
    // Check if the post already exists in the selected reading list
    const { data: exists, error: existsError } = await supabase
      .from("reading_list_posts")
      .select("id")
      .eq("reading_list_id", listId)
      .eq("post_id", postId)
      .maybeSingle();
    if (existsError) {
      console.error(
        "Error checking if post is in reading list:",
        existsError.message,
      );
    }
    if (exists) {
      // Do nothing if the post is already added
      setLoading(false);
      setShowDropdown(false);
      return;
    }

    // Insert if not already in the reading list
    const { error } = await supabase
      .from("reading_list_posts")
      .insert([{ reading_list_id: listId, post_id: postId }]);
    if (error) {
      console.error("Error adding post to reading list:", error.message);
    } else {
      setAdded(true);
    }
    setLoading(false);
    setShowDropdown(false);
  };

  const handleClick = async () => {
    if (!user) {
      console.error("User must be signed in to add posts to a reading list.");
      return;
    }
    if (readingLists.length === 0) {
      // Create a default list if none exist.
      const { data, error } = await supabase
        .from("reading_lists")
        .insert([{ user_id: user.id, title: "Reading List", is_public: false }])
        .select("*")
        .single();
      if (error) {
        console.error("Error creating reading list:", error.message);
        return;
      }
      setReadingLists([data]);
      handleAddToList(data.id);
    } else if (readingLists.length === 1) {
      // Only one exists, add directly.
      handleAddToList(readingLists[0].id);
    } else {
      // More than one exists, toggle dropdown for selection.
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
