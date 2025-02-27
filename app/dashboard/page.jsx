// app/dashboard/page.jsx
"use client";

import Image from "next/image";

export default function DashboardPage() {
    // Placeholder user data
    const user = {
        name: "Daniel Block",
        avatar: "/images/hero.png", // Replace with actual avatar
        role: ".NET Cloud Application Developer",
    };

    // Placeholder pinned post
    const pinnedPost = {
        title: "Discover a New Way to Track Your Mood with Moodcatcher.net",
        excerpt:
            "In today's fast-paced world, understanding and managing your mental health is more important than ever...",
        date: "June 15, 2026",
    };

    // Placeholder post list
    const posts = [
        {
            id: "1",
            title: "Building a Cloud-Native App with .NET",
            excerpt:
                "Learn how to spin up your first microservice-based app with Docker and .NET 7...",
            date: "June 1, 2026",
        },
        {
            id: "2",
            title: "Why Minimalism Matters in UI Design",
            excerpt:
                "A clean and simple interface can vastly improve user experience. Let's dive in...",
            date: "May 20, 2026",
        },
    ];

    return (
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 px-4 py-12 h-screen">
            {/* Left Column: Posts Section */}
            <div className="md:w-3/5 space-y-8">
                {/* Simple nav for the user's content sections */}
                <nav className="flex items-center space-x-6 mb-6 text-sm text-gray-600">
                    <a href="#" className="hover:underline font-semibold">
                        Home
                    </a>
                    <a href="#" className="hover:underline">
                        Lists
                    </a>
                    <a href="#" className="hover:underline">
                        About
                    </a>
                </nav>

                {/* Pinned Post */}
                <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                        <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9.75 9.75l4.5 4.5m0 0L12 17.25m2.25-3L9.75 12"
                            />
                        </svg>
                        <span>Pinned</span>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">{pinnedPost.title}</h2>
                    <p className="text-gray-700 mb-2">{pinnedPost.excerpt}</p>
                    <p className="text-sm text-gray-500">{pinnedPost.date}</p>
                </div>

                {/* Other Posts */}
                <div className="space-y-6">
                    {posts.map((post) => (
                        <div key={post.id} className="border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-semibold mb-1">{post.title}</h3>
                            <p className="text-gray-700 mb-1">{post.excerpt}</p>
                            <p className="text-sm text-gray-500">{post.date}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: User Info */}
            <div className="md:w-2/5">
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <Image
                        src={user.avatar}
                        alt="User Avatar"
                        width={80}
                        height={80}
                        className="rounded-full object-cover mb-4"
                    />
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <p className="text-gray-500 text-sm mb-4">{user.role}</p>
                    <a
                        href="#"
                        className="text-sm text-green-600 hover:underline font-medium"
                    >
                        Edit Profile
                    </a>
                </div>
            </div>
        </div>
    );
}
