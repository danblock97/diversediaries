"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import FeedbackModal from "@/components/FeedbackModal";
import LikeButton from "@/components/LikeButton";
import Comment from "@/components/Comment";

export default function PostDetail({ id }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(
    searchParams.get("feedback") === "true",
  );

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [readTime, setReadTime] = useState("5 min");
  const [replyingTo, setReplyingTo] = useState(null);
  const [commentThreads, setCommentThreads] = useState({});

  useEffect(() => {
    async function fetchPost() {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch post data
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select("*")
          .eq("id", id)
          .single();

        if (postError)
          throw new Error(postError.message || "Failed to fetch post");
        if (!postData) throw new Error("Post not found");

        const wordCount = postData.content.split(/\s+/).length;
        const estimatedReadTime = Math.ceil(wordCount / 200);
        setReadTime(`${estimatedReadTime} min read`);

        // Fetch the author's profile data (display_name, email, bio, profile_picture)
        let authorProfile = null;
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("display_name, email, bio, profile_picture")
            .eq("id", postData.user_id)
            .single();
          if (!profileError) authorProfile = profile;
        } catch (profileErr) {
          console.error("Profile fetch exception:", profileErr);
        }

        // Build a display name: prefer display_name, then email, then "Anonymous"
        const displayName =
          authorProfile?.display_name || authorProfile?.email || "Anonymous";

        // Fetch categories if available
        let categories = [];
        try {
          const { data: categoryData } = await supabase
            .from("post_categories")
            .select("category_id")
            .eq("post_id", id);
          if (categoryData?.length > 0) {
            const categoryIds = categoryData.map((pc) => pc.category_id);
            const { data: categoriesData } = await supabase
              .from("categories")
              .select("*")
              .in("id", categoryIds);
            categories = categoriesData || [];
          }
        } catch (catErr) {
          console.error("Categories fetch exception:", catErr);
        }

        setPost({
          ...postData,
          profiles: {
            ...authorProfile,
            display_name: displayName,
          },
          post_categories: categories.map((cat) => ({
            categories: cat,
          })),
        });
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(err.message || "Failed to load post");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id, user]);

  const fetchComments = async () => {
    if (!id) return;

    try {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message || "Failed to fetch comments");

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setCommentThreads({});
        return;
      }

      // Gather unique user IDs from comments
      const userIds = [
        ...new Set(commentsData.map((comment) => comment.user_id)),
      ];

      let profilesData = {};
      if (userIds.length > 0) {
        console.log("Fetching profiles for user IDs:", userIds);

        // Fetch profile data for each user
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);

        console.log(
          "Profiles fetch result:",
          profiles,
          "Error:",
          profilesError,
        );

        if (!profilesError && profiles) {
          // Create a lookup object with user_id as key
          profiles.forEach((profile) => {
            profilesData[profile.id] = profile;
          });
        }
      }

      // Attach profile data to each comment
      const commentsWithProfiles = commentsData.map((comment) => {
        return {
          ...comment,
          profiles: profilesData[comment.user_id] || {},
        };
      });

      // Add console logs here, inside the function where the variables exist
      console.log("Comments with profiles:", commentsWithProfiles);
      console.log("Profile data lookup:", profilesData);

      // Build comment threads
      const threads = {};
      commentsWithProfiles.forEach((comment) => {
        if (comment.parent_comment_id) {
          if (!threads[comment.parent_comment_id]) {
            threads[comment.parent_comment_id] = { replies: [] };
          }
          threads[comment.parent_comment_id].replies.push(comment);
        } else {
          if (!threads[comment.id]) {
            threads[comment.id] = { replies: [] };
          }
        }
      });

      setCommentThreads(threads);
      setComments(commentsWithProfiles.filter((c) => !c.parent_comment_id));
    } catch (err) {
      console.error(
        "Error fetching comments:",
        err.message || JSON.stringify(err),
      );
      setComments([]);
      setCommentThreads({});
    }
  };

  // Fix the useEffect - remove the console.log statements here
  useEffect(() => {
    fetchComments();
  }, [id, user]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      alert("Please sign in to comment");
      return;
    }

    setCommentLoading(true);
    try {
      const commentData = {
        post_id: id,
        user_id: user.id,
        content: newComment.trim(),
        parent_comment_id: replyingTo || null, // Track if this is a reply
      };

      const { data: insertedComment, error: commentError } = await supabase
        .from("comments")
        .insert([commentData])
        .select()
        .single();

      if (commentError) {
        console.error("❌ Error inserting comment:", commentError);
        throw new Error(commentError.message);
      }

      console.log("✅ Comment inserted successfully:", insertedComment);

      // 1️⃣ Notify the post author if someone (not the author) comments on their post
      if (post?.user_id && post.user_id !== user.id) {
        const notificationMessage = `Someone commented on your post: "${newComment.trim().slice(0, 250)}..."`;

        await supabase.from("notifications").insert([
          {
            recipient_id: post.user_id, // Post owner
            type: "comment",
            message: notificationMessage,
            is_read: false,
          },
        ]);
      }

      // 2️⃣ Notify the original commenter if the post author replies to their comment
      if (replyingTo) {
        const { data: parentComment, error: parentError } = await supabase
          .from("comments")
          .select("user_id")
          .eq("id", replyingTo)
          .single();

        if (!parentError && parentComment?.user_id !== user.id) {
          const replyMessage = `Someone replied to your comment: "${newComment.trim().slice(0, 250)}..."`;

          await supabase.from("notifications").insert([
            {
              recipient_id: parentComment.user_id, // Original commenter
              type: "reply",
              message: replyMessage,
              is_read: false,
            },
          ]);

          console.log("✅ Reply notification sent to:", parentComment.user_id);
        }
      }

      await fetchComments();
      setNewComment("");
      setReplyingTo(null);
    } catch (err) {
      console.error("❌ Failed to post comment:", err);
      alert("Failed to post comment. Please try again.");
    } finally {
      setCommentLoading(false);
    }
  };

  const processContent = (content) => {
    if (!content) return "";
    let processed = content;
    processed = processed.replace(
      /<img([^>]*)>/g,
      '<img$1 class="my-8 max-w-full h-auto rounded-lg shadow-md">',
    );
    processed = processed.replace(
      /<p>/g,
      '<p class="text-lg text-gray-800 mb-7 leading-relaxed font-serif">',
    );
    processed = processed.replace(
      /<h2>/g,
      '<h2 class="text-3xl font-serif font-bold mt-12 mb-6 text-gray-900">',
    );
    processed = processed.replace(
      /<h3>/g,
      '<h3 class="text-2xl font-serif font-bold mt-10 mb-4 text-gray-900">',
    );
    processed = processed.replace(
      /<a /g,
      '<a class="text-blue-600 underline decoration-blue-500/30 hover:decoration-blue-500" ',
    );
    processed = processed.replace(
      /<blockquote>/g,
      '<blockquote class="border-l-4 border-gray-200 pl-4 italic my-6 text-gray-700">',
    );
    processed = processed.replace(
      /<ul>/g,
      '<ul class="list-disc pl-6 my-6 space-y-2">',
    );
    processed = processed.replace(
      /<ol>/g,
      '<ol class="list-decimal pl-6 my-6 space-y-2">',
    );
    return processed;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Loading post...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-lg text-red-600">{error || "Post not found"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <header className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.post_categories?.map((pc) => (
              <span
                key={pc.categories.id}
                className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                {pc.categories.name}
              </span>
            ))}
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 bg-gray-300 rounded-full overflow-hidden">
              {post.profiles?.profile_picture ? (
                <img
                  src={post.profiles.profile_picture}
                  alt="Author"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                  {post.profiles?.display_name?.charAt(0)?.toUpperCase() || "A"}
                </div>
              )}
            </div>
            <div className="ml-4">
              <p className="text-base font-medium text-gray-900">
                {post.profiles?.display_name || "Anonymous"}
              </p>
              <div className="flex text-sm text-gray-500 items-center">
                <span>
                  {new Date(post.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="mx-1">•</span>
                <span>{readTime}</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="article-content font-serif"
          dangerouslySetInnerHTML={{ __html: processContent(post.content) }}
        />
        <div className="mt-8 flex items-center justify-end">
          <LikeButton postId={id} userId={user?.id} />
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('DOMContentLoaded', () => {
                const firstP = document.querySelector('.article-content > p:first-of-type');
                if (firstP) {
                  firstP.classList.add('text-xl', 'font-medium');
                }
              });
            `,
          }}
        />
        <div className="border-t border-gray-200 my-12 pt-8">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-16 w-16 bg-gray-300 rounded-full overflow-hidden">
              {post.profiles?.profile_picture ? (
                <img
                  src={post.profiles.profile_picture}
                  alt="Author"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500 text-xl">
                  {post.profiles?.display_name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="ml-4">
              <p className="text-lg font-medium text-gray-900">
                {post.profiles?.display_name || "Anonymous"}
              </p>
              <p className="text-gray-600 mt-1">{post.profiles?.bio}</p>
            </div>
          </div>
        </div>
      </article>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 rounded-lg my-8">
        <h2 className="text-2xl font-bold font-serif mb-8">Comments</h2>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <textarea
            placeholder={
              replyingTo
                ? "Write a reply..."
                : user
                  ? "Write a comment..."
                  : "Sign in to comment"
            }
            className="w-full border border-gray-200 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            rows="4"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!user}
          />
          <div className="mt-4 flex justify-between items-center">
            {replyingTo && (
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={() => setReplyingTo(null)}
              >
                Cancel Reply
              </button>
            )}
            <button
              className={`px-5 py-2 rounded-full font-medium ${
                user
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              } transition`}
              onClick={handlePostComment}
              disabled={!user || commentLoading}
            >
              {commentLoading
                ? "Posting..."
                : replyingTo
                  ? "Post Reply"
                  : "Post Comment"}
            </button>
          </div>
        </div>
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const thread = commentThreads[comment.id];
              return (
                <div key={comment.id} className="comment-thread">
                  <Comment
                    comment={comment}
                    onReply={() => {
                      setReplyingTo(comment.id);
                      document.querySelector("textarea").focus();
                    }}
                  />

                  {thread?.replies && thread.replies.length > 0 && (
                    <div className="ml-12 mt-2 space-y-4">
                      {thread.replies.map((reply, index) => (
                        <Comment
                          key={`${reply.id}-${index}`}
                          comment={reply}
                          isReply={true}
                          onReply={() => {
                            setReplyingTo(comment.id);
                            document.querySelector("textarea").focus();
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => {
          setFeedbackModalOpen(false);
          router.replace(`/posts/${id}`);
        }}
        onFeedbackSubmitted={() => {
          setFeedbackModalOpen(false);
          router.replace(`/posts/${id}`);
        }}
      />
    </div>
  );
}
