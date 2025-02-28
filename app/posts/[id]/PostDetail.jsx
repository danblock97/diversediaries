"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import FeedbackModal from "@/components/FeedbackModal";
import LikeButton from "@/components/LikeButton";

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
        // Fetch profile data for each user (display_name, email, avatar_url)
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, display_name, email, avatar_url")
          .in("id", userIds);

        if (!profilesError && profiles) {
          profiles.forEach((profile) => {
            profilesData[profile.id] = profile;
          });
        }
      }

      // Attach display name to each comment with a fallback: display_name > email > "Anonymous"
      const commentsWithProfiles = commentsData.map((comment) => {
        const userProfile = profilesData[comment.user_id] || {};
        const displayName =
          userProfile.display_name || userProfile.email || "Anonymous";
        return {
          ...comment,
          profiles: {
            ...userProfile,
            display_name: displayName,
          },
        };
      });

      // Build up comment reply threads
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
      };

      if (replyingTo) {
        commentData.parent_comment_id = replyingTo;
      }

      const { data, error } = await supabase
        .from("comments")
        .insert([commentData])
        .select();

      if (error) throw new Error(error.message);

      // (Optional) Create notification logic can be added here

      await fetchComments();
      setNewComment("");
      setReplyingTo(null);
    } catch (err) {
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
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full overflow-hidden mr-4">
                        {comment.profiles?.avatar_url ? (
                          <img
                            src={comment.profiles.avatar_url}
                            alt="Commenter"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                            {comment.profiles?.display_name
                              ?.charAt(0)
                              ?.toUpperCase() || "A"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {comment.profiles?.display_name || "Anonymous"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-800 whitespace-pre-line">
                            {comment.content}
                          </p>
                        </div>
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              setReplyingTo(comment.id);
                              document.querySelector("textarea").focus();
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                              />
                            </svg>
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {thread?.replies && thread.replies.length > 0 && (
                    <div className="ml-12 mt-2 space-y-4">
                      {thread.replies.map((reply, index) => (
                        <div
                          key={`${reply.id}-${index}`}
                          className="bg-white rounded-lg border-l-4 border-gray-200 pl-4 p-6 mb-4"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full overflow-hidden mr-4">
                              {reply.profiles?.avatar_url ? (
                                <img
                                  src={reply.profiles.avatar_url}
                                  alt="Commenter"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                                  {reply.profiles?.display_name
                                    ?.charAt(0)
                                    ?.toUpperCase() || "A"}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {reply.profiles?.display_name ||
                                      "Anonymous"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(
                                      reply.created_at,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="prose prose-sm max-w-none">
                                <p className="text-gray-800 whitespace-pre-line">
                                  {reply.content}
                                </p>
                              </div>
                              <div className="mt-3">
                                <button
                                  onClick={() => {
                                    setReplyingTo(comment.id);
                                    document.querySelector("textarea").focus();
                                  }}
                                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                    />
                                  </svg>
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
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
