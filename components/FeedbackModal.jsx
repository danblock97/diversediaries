"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function FeedbackModal({
  isOpen,
  onClose,
  onFeedbackSubmitted,
}) {
  const { user } = useAuth(); // Get the current user from context
  const [categoryName, setCategoryName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      setError("Please provide details about the category you'd like to see.");
      return;
    }
    if (!user || !user.id) {
      setError("User not authenticated. Please log in.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Retrieve profile information via your profile API route.
      const profileRes = await fetch(`/api/profile/${user.id}`);
      if (!profileRes.ok) {
        throw new Error("Failed to retrieve profile information.");
      }
      const profile = await profileRes.json();

      let fullFeedback = feedback;
      if (categoryName.trim()) {
        fullFeedback = `Category Name: ${categoryName}\nWhy it's useful: ${feedback}`;
      }

      // Submit feedback via your feedback API route.
      const feedbackRes = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: fullFeedback,
          user_id: user.id,
          email: profile.email || null,
          display_name: profile.display_name || null,
        }),
      });
      if (!feedbackRes.ok) {
        const errData = await feedbackRes.json();
        throw new Error(errData.error || "Failed to submit feedback.");
      }
      onFeedbackSubmitted();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred overlay */}
      <div
        className="absolute inset-0 bg-opacity-75 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row">
        {/* Left side with image */}
        <div className="md:w-2/5 bg-blue-50 p-6 flex items-center justify-center">
          <div className="relative w-full h-40 md:h-full max-h-64 md:max-h-none">
            <img
              src="/images/hero.png"
              alt="Diverse Diaries"
              className="object-contain w-full h-full"
            />
          </div>
        </div>
        {/* Right side with form */}
        <div className="md:w-3/5 p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="mb-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
              Suggest a New Category
            </h2>
            <p className="text-gray-600">
              We noticed you selected "Other". Help us improve by suggesting
              categories that would better represent your content.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="category-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Suggested Category Name
              </label>
              <input
                id="category-name"
                type="text"
                className="w-full border border-gray-300 p-3 rounded-md text-lg mb-4"
                placeholder="e.g., Technology, Personal Growth"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="category-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Why this category would be useful
              </label>
              <textarea
                id="category-description"
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Please describe what kind of content would fall under this category and why it would be valuable..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              ></textarea>
            </div>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={onClose}
                className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-black text-white rounded-md font-medium disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit Suggestion"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
