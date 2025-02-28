// components/LikeButton.jsx
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LikeButton({ postId, userId }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Check if the post is liked by the current user and get the total like count
  useEffect(() => {
    async function fetchLikeStatus() {
      if (!postId) return;

      try {
        // Get total like count for the post
        const { data, error: countError } = await supabase
          .from("likes")
          .select("*", { count: "exact" })
          .eq("post_id", postId);

        if (!countError) {
          setLikeCount(data?.length || 0);
        }

        // Only check user like status if logged in
        if (userId) {
          const { data: likeData, error: likeError } = await supabase
            .from("likes")
            .select("*")
            .eq("post_id", postId)
            .eq("user_id", userId);

          if (!likeError && likeData && likeData.length > 0) {
            setIsLiked(true);
          }
        }
      } catch (err) {
        console.error("Error checking like status:", err);
      }
    }

    fetchLikeStatus();
  }, [postId, userId]);

  // components/LikeButton.jsx - update the toggleLike function
  const toggleLike = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      if (isLiked) {
        // Unlike: remove the like from the database
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);

        if (error) throw error;

        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        // Like: add a new like to the database
        const { error } = await supabase.from("likes").insert([
          {
            post_id: postId,
            user_id: userId,
          },
        ]);

        if (error) throw error;

        setIsLiked(true);
        setLikeCount((prev) => prev + 1);

        // Create notification for post author (add this code)
        const { data: postData } = await supabase
          .from("posts")
          .select("user_id, title")
          .eq("id", postId)
          .single();

        // Only create notification if post exists and author is not the same as liker
        if (postData && postData.user_id !== userId) {
          await supabase.from("notifications").insert([
            {
              recipient_id: postData.user_id,
              type: "like",
              message: `Someone liked your post "${postData.title.substring(0, 30)}${postData.title.length > 30 ? "..." : ""}"`,
              is_read: false,
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleLike}
      disabled={isLoading || !userId}
      className="flex items-center gap-1 focus:outline-none"
      title={userId ? (isLiked ? "Unlike" : "Like") : "Sign in to like"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={isLiked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`w-6 h-6 transition-colors ${
          isLiked ? "text-red-500" : "text-gray-500"
        } ${!userId ? "opacity-50" : "hover:text-red-500"}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      <span className={`text-sm ${isLiked ? "text-red-500" : "text-gray-500"}`}>
        {likeCount}
      </span>
    </button>
  );
}
