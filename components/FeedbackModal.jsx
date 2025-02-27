"use client";

import { useState } from "react";

export default function FeedbackModal({ isOpen, onClose, onFeedbackSubmitted }) {
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            setError("Feedback cannot be empty.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            // Call your API endpoint to send email feedback.
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedback }),
            });
            if (!res.ok) {
                throw new Error("Failed to send feedback.");
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
            {/* Blurred background */}
            <div
                className="absolute inset-0 bg-black opacity-50 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full mx-4 p-6">
                <h2 className="text-xl font-bold mb-4">Feedback</h2>
                <p className="mb-4 text-gray-700">
                    You selected "Other". Please let us know which categories you think are missing.
                </p>
                <textarea
                    className="w-full border border-gray-300 p-3 rounded-md text-lg"
                    rows="4"
                    placeholder="Your feedback..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                ></textarea>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="mt-4 bg-black text-white px-6 py-3 rounded-full disabled:opacity-50"
                >
                    {loading ? "Sending..." : "Submit Feedback"}
                </button>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                    &times;
                </button>
            </div>
        </div>
    );
}
