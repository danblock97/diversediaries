"use client";

import Head from "next/head";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import FeedbackModal from "@/components/FeedbackModal";
import LikeButton from "@/components/LikeButton";
import Comment from "@/components/Comment";
import LoadingAnimation from "@/components/LoadingAnimation";

// A simple fetcher for SWR
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function PostPage() {
	const { id } = useParams();
	const { user } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();

	// Modal states for feedback and reporting
	const [feedbackModalOpen, setFeedbackModalOpen] = useState(
		searchParams.get("feedback") === "true"
	);
	const [reportModalOpen, setReportModalOpen] = useState(false);
	const [reportReason, setReportReason] = useState("");
	const [reportLoading, setReportLoading] = useState(false);
	const [reportError, setReportError] = useState("");

	// Comments states
	const [comments, setComments] = useState([]);
	const [commentThreads, setCommentThreads] = useState({});
	const [newComment, setNewComment] = useState("");
	const [commentLoading, setCommentLoading] = useState(false);
	const [replyingTo, setReplyingTo] = useState(null);

	// SWR hook to fetch the post data
	const {
		data: post,
		error,
		isLoading,
	} = useSWR(id ? `/api/posts/${id}` : null, fetcher, {
		revalidateOnFocus: false,
	});

	// SWR hook to fetch the comments for the post
	const {
		data: commentsData,
		error: commentsError,
		mutate: mutateComments,
	} = useSWR(id ? `/api/comments?post_id=${id}` : null, fetcher, {
		revalidateOnFocus: false,
	});

	// Process comments data into threads when it updates
	useEffect(() => {
		if (commentsData) {
			const threads = {};
			commentsData.forEach((comment) => {
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
			setComments(commentsData.filter((c) => !c.parent_comment_id));
		}
	}, [commentsData]);

	// Report functionality using the API route
	const openReportModal = () => {
		if (!user) {
			alert("Please sign in to report this post.");
			return;
		}
		setReportModalOpen(true);
	};

	const submitReport = async () => {
		if (!reportReason.trim()) {
			setReportError("Please provide a reason for reporting.");
			return;
		}
		setReportLoading(true);
		setReportError("");
		try {
			const res = await fetch(`/api/reports`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					reporter_id: user.id,
					post_id: id,
					reason: reportReason.trim(),
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				setReportError(data.error);
				return;
			}
			setReportModalOpen(false);
			setReportReason("");
			alert("Report submitted successfully.");
		} catch (err) {
			setReportError(err.message);
		} finally {
			setReportLoading(false);
		}
	};

	// Inline Report Modal component
	const ReportModal = () => {
		if (!reportModalOpen) return null;
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div
					className="absolute inset-0 bg-black opacity-50"
					onClick={() => setReportModalOpen(false)}
				/>
				<div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-auto">
					<h3 className="text-xl font-bold mb-4">Report Post</h3>
					<p className="mb-4">
						Please let us know why you are reporting this post.
					</p>
					<textarea
						className="w-full border border-gray-300 rounded-md p-3 mb-4 focus:ring-2 focus:ring-blue-500"
						rows="4"
						placeholder="Type your reason here..."
						value={reportReason}
						onChange={(e) => setReportReason(e.target.value)}
					></textarea>
					{reportError && (
						<p className="text-sm text-red-600 mb-4">{reportError}</p>
					)}
					<div className="flex justify-end space-x-4">
						<button
							onClick={() => setReportModalOpen(false)}
							className="px-4 py-2 rounded border hover:bg-gray-100"
						>
							Cancel
						</button>
						<button
							onClick={submitReport}
							disabled={reportLoading}
							className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
						>
							{reportLoading ? "Submitting..." : "Submit Report"}
						</button>
					</div>
				</div>
			</div>
		);
	};

	// Post comment via the API route
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
				parent_comment_id: replyingTo || null,
			};

			const res = await fetch(`/api/comments`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(commentData),
			});
			const insertedComment = await res.json();
			if (!res.ok) {
				console.error("Error inserting comment:", insertedComment.error);
				setCommentLoading(false);
				return;
			}

			// Notify post author if commenter is not the post owner
			if (post?.user_id && post.user_id !== user.id) {
				const notificationMessage = `Someone commented on your post: "${newComment
					.trim()
					.slice(0, 250)}..."`;
				await fetch(`/api/notifications`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						recipient_id: post.user_id,
						type: "comment",
						message: notificationMessage,
						is_read: false,
					}),
				});
			}

			// Notify original commenter if replying
			if (replyingTo) {
				const parent = comments.find((c) => c.id === replyingTo);
				if (parent && parent.user_id !== user.id) {
					const replyMessage = `Someone replied to your comment: "${newComment
						.trim()
						.slice(0, 250)}..."`;
					await fetch(`/api/notifications`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							recipient_id: parent.user_id,
							type: "reply",
							message: replyMessage,
							is_read: false,
						}),
					});
				}
			}

			// Revalidate comments using SWR's mutate
			mutateComments();
			setNewComment("");
			setReplyingTo(null);
		} catch (err) {
			console.error("Failed to post comment:", err);
			alert("Failed to post comment. Please try again.");
		} finally {
			setCommentLoading(false);
		}
	};

	// Function to process HTML content and add styling classes
	const processContent = (content) => {
		if (!content) return "";
		let processed = content;
		processed = processed.replace(
			/<img([^>]*)>/g,
			'<img$1 class="my-8 max-w-full h-auto rounded-lg shadow-md">'
		);
		processed = processed.replace(
			/<p>/g,
			'<p class="text-base sm:text-lg text-gray-800 mb-7 leading-relaxed font-serif">'
		);
		processed = processed.replace(
			/<h2>/g,
			'<h2 class="text-2xl sm:text-3xl font-serif font-bold mt-12 mb-6 text-gray-900">'
		);
		processed = processed.replace(
			/<h3>/g,
			'<h3 class="text-xl sm:text-2xl font-serif font-bold mt-10 mb-4 text-gray-900">'
		);
		processed = processed.replace(
			/<a /g,
			'<a class="text-blue-600 underline decoration-blue-500/30 hover:decoration-blue-500" '
		);
		processed = processed.replace(
			/<blockquote>/g,
			'<blockquote class="border-l-4 border-gray-200 pl-4 italic my-6 text-gray-700">'
		);
		processed = processed.replace(
			/<ul>/g,
			'<ul class="list-disc pl-6 my-6 space-y-2">'
		);
		processed = processed.replace(
			/<ol>/g,
			'<ol class="list-decimal pl-6 my-6 space-y-2">'
		);
		return processed;
	};

	if (error) {
		return (
			<div className="max-w-3xl mx-auto px-4 py-12">
				<p className="text-lg text-red-600">
					{error.message || "Failed to load post"}
				</p>
			</div>
		);
	}

	if (isLoading || !post) {
		return (
			<div className="flex justify-center items-center min-h-[60vh] overflow-x-hidden">
				<LoadingAnimation />
			</div>
		);
	}

	return (
		<div className="bg-white min-h-screen overflow-x-hidden">
			<Head>
				<title>{post.title}</title>
				<meta property="og:title" content={post.title} />
				<meta
					property="og:description"
					content={post.description || "Check out this post!"}
				/>
				<meta
					property="og:image"
					content={
						post.image || "https://yourdomain.com/path/to/default-image.jpg"
					}
				/>
				<meta property="og:url" content={`http://localhost:3000/posts/${id}`} />
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:title" content={post.title} />
				<meta
					name="twitter:description"
					content={post.description || "Check out this post!"}
				/>
				<meta
					name="twitter:image"
					content={
						post.image || "https://yourdomain.com/path/to/default-image.jpg"
					}
				/>
			</Head>
			{ReportModal()}
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
					<h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 leading-tight mb-4">
						{post.title}
					</h1>
					<Link href={`/profile/${post.user_id}`}>
						<div className="flex items-center cursor-pointer">
							<div className="flex-shrink-0 h-12 w-12 bg-gray-300 rounded-full overflow-hidden">
								{post.profiles?.profile_picture ? (
									<img
										src={post.profiles.profile_picture}
										alt="Author"
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
										{post.profiles?.display_name?.charAt(0)?.toUpperCase() ||
											"A"}
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
									<span>{post.readTime}</span>
								</div>
							</div>
						</div>
					</Link>
				</div>
			</header>
			<article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div
					className="article-content font-serif"
					dangerouslySetInnerHTML={{ __html: processContent(post.content) }}
				/>
				<div className="mt-8 flex flex-wrap items-center justify-end gap-4">
					<LikeButton postId={id} userId={user?.id} />
					<button
						onClick={openReportModal}
						className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
					>
						Report Post
					</button>
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
						placeholder={user ? "Write a comment..." : "Sign in to comment"}
						className="w-full border border-gray-200 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
						rows="4"
						value={newComment}
						onChange={(e) => setNewComment(e.target.value)}
						disabled={!user}
					/>
					<div className="mt-4 flex flex-wrap items-center justify-between gap-2">
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
											{thread.replies.map((reply) => (
												<Comment
													key={reply.id}
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
