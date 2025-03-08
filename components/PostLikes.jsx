// components/PostLikes.jsx
import { useState, useEffect } from "react";

export default function PostLikes({ postId }) {
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    async function fetchLikes() {
      if (!postId) return;

      try {
        const res = await fetch(`/api/likes?postId=${postId}`);
        if (!res.ok) {
          console.error("Error fetching likes");
          return;
        }
        const data = await res.json();
        setLikeCount(data.count);
      } catch (err) {
        console.error("Error fetching likes:", err);
      }
    }

    fetchLikes();
  }, [postId]);

  return (
    <div className="flex items-center text-gray-500 text-sm">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-4 h-4 mr-1"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {likeCount}
    </div>
  );
}
