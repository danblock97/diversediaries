"use client";

import { useState } from "react";

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("overview");

    // Placeholder data for demonstration
    const totalPosts = 123;
    const reportedItems = 5;
    const activeUsers = 50;

    const users = [
        { id: 1, name: "John Doe", email: "john@example.com", banned: false },
        { id: 2, name: "Jane Smith", email: "jane@example.com", banned: true },
    ];

    const posts = [
        {
            id: 1,
            title: "Hello World",
            author: "John Doe",
            date: "July 10, 2026",
        },
        {
            id: 2,
            title: "Another Great Post",
            author: "Jane Smith",
            date: "July 12, 2026",
        },
    ];

    const comments = [
        {
            id: 1,
            excerpt: "This is a fantastic article!",
            author: "Commenter A",
            date: "July 15, 2026",
        },
        {
            id: 2,
            excerpt: "I completely disagree with your premise.",
            author: "Commenter B",
            date: "July 16, 2026",
        },
    ];

    const reports = [
        {
            id: 1,
            itemType: "Post",
            itemTitle: "Offensive Post Title",
            reason: "Hate speech",
            date: "July 18, 2026",
        },
        {
            id: 2,
            itemType: "Comment",
            itemTitle: "Some Comment Excerpt",
            reason: "Harassment",
            date: "July 19, 2026",
        },
    ];

    return (
        <div className="flex h-screen">
            {/* Side Navigation */}
            <aside className="w-64 p-4 border-r border-gray-200 space-y-2">
                <h2 className="text-xl font-bold mb-4">Admin Dashboard</h2>
                <nav className="flex flex-col space-y-2 text-sm">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`text-left px-3 py-2 rounded hover:bg-gray-100 ${
                            activeTab === "overview" ? "bg-gray-200 font-semibold" : ""
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`text-left px-3 py-2 rounded hover:bg-gray-100 ${
                            activeTab === "users" ? "bg-gray-200 font-semibold" : ""
                        }`}
                    >
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab("posts")}
                        className={`text-left px-3 py-2 rounded hover:bg-gray-100 ${
                            activeTab === "posts" ? "bg-gray-200 font-semibold" : ""
                        }`}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveTab("comments")}
                        className={`text-left px-3 py-2 rounded hover:bg-gray-100 ${
                            activeTab === "comments" ? "bg-gray-200 font-semibold" : ""
                        }`}
                    >
                        Comments
                    </button>
                    <button
                        onClick={() => setActiveTab("reports")}
                        className={`text-left px-3 py-2 rounded hover:bg-gray-100 ${
                            activeTab === "reports" ? "bg-gray-200 font-semibold" : ""
                        }`}
                    >
                        Reports
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">
                {activeTab === "overview" && (
                    <Overview totalPosts={totalPosts} reportedItems={reportedItems} activeUsers={activeUsers} />
                )}
                {activeTab === "users" && <Users data={users} />}
                {activeTab === "posts" && <Posts data={posts} />}
                {activeTab === "comments" && <Comments data={comments} />}
                {activeTab === "reports" && <Reports data={reports} />}
            </main>
        </div>
    );
}

/* Overview Section */
function Overview({ totalPosts, reportedItems, activeUsers }) {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 border border-gray-200 rounded shadow">
                    <h3 className="text-xl font-semibold mb-2">Total Posts</h3>
                    <p className="text-3xl font-bold">{totalPosts}</p>
                </div>
                <div className="p-6 border border-gray-200 rounded shadow">
                    <h3 className="text-xl font-semibold mb-2">Reported Items</h3>
                    <p className="text-3xl font-bold">{reportedItems}</p>
                </div>
                <div className="p-6 border border-gray-200 rounded shadow">
                    <h3 className="text-xl font-semibold mb-2">Active Users</h3>
                    <p className="text-3xl font-bold">{activeUsers}</p>
                </div>
            </div>
        </div>
    );
}

/* Users Section */
function Users({ data }) {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Users</h2>
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b">
                    <th className="py-2 px-2 text-sm text-gray-600">Name</th>
                    <th className="py-2 px-2 text-sm text-gray-600">Email</th>
                    <th className="py-2 px-2 text-sm text-gray-600">Status</th>
                    <th className="py-2 px-2 text-sm text-gray-600">Actions</th>
                </tr>
                </thead>
                <tbody>
                {data.map((user) => (
                    <tr key={user.id} className="border-b">
                        <td className="py-2 px-2">{user.name}</td>
                        <td className="py-2 px-2 text-gray-700">{user.email}</td>
                        <td className="py-2 px-2">
                            {user.banned ? (
                                <span className="text-red-500 text-sm">Banned</span>
                            ) : (
                                <span className="text-green-500 text-sm">Active</span>
                            )}
                        </td>
                        <td className="py-2 px-2 space-x-2">
                            {user.banned ? (
                                <button className="text-sm text-blue-600 hover:underline">
                                    Unban
                                </button>
                            ) : (
                                <button className="text-sm text-red-600 hover:underline">
                                    Ban
                                </button>
                            )}
                            <button className="text-sm text-gray-600 hover:underline">
                                View
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

/* Posts Section */
function Posts({ data }) {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Posts</h2>
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b">
                    <th className="py-2 px-2 text-sm text-gray-600">Title</th>
                    <th className="py-2 px-2 text-sm text-gray-600">Author</th>
                    <th className="py-2 px-2 text-sm text-gray-600">Date</th>
                    <th className="py-2 px-2 text-sm text-gray-600">Actions</th>
                </tr>
                </thead>
                <tbody>
                {data.map((post) => (
                    <tr key={post.id} className="border-b">
                        <td className="py-2 px-2">{post.title}</td>
                        <td className="py-2 px-2 text-gray-700">{post.author}</td>
                        <td className="py-2 px-2 text-sm text-gray-500">{post.date}</td>
                        <td className="py-2 px-2 space-x-2">
                            <button className="text-sm text-blue-600 hover:underline">
                                Edit
                            </button>
                            <button className="text-sm text-red-600 hover:underline">
                                Remove
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

/* Comments Section */
function Comments({ data }) {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Comments</h2>
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b">
                    <th className="py-2 px-2 text-sm text-gray-600">Excerpt</th>
                    <th className="py-2 px-2 text-sm text-gray-600">Author</th>
                    <th className="py-2 px-2 text-sm text-gray-600">Date</th>
                    <th className="py-2 px-2 text-sm text-gray-600">Actions</th>
                </tr>
                </thead>
                <tbody>
                {data.map((comment) => (
                    <tr key={comment.id} className="border-b">
                        <td className="py-2 px-2">{comment.excerpt}</td>
                        <td className="py-2 px-2 text-gray-700">{comment.author}</td>
                        <td className="py-2 px-2 text-sm text-gray-500">
                            {comment.date}
                        </td>
                        <td className="py-2 px-2">
                            <button className="text-sm text-red-600 hover:underline">
                                Remove
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

/* Reports Section */
function Reports({ data }) {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Reports</h2>
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b">
                    <th className="py-2 px-2 text-sm text-gray-600">Item Type</th>
                    <th className="py-2 px-2 text-sm text-gray-600">Title</th>
                    <th className="py-2 px-2 text-sm text-gray-600">Reason</th>
                    <th className="py-2 px-2 text-sm text-gray-600">Date</th>
                    <th className="py-2 px-2 text-sm text-gray-600">Actions</th>
                </tr>
                </thead>
                <tbody>
                {data.map((report) => (
                    <tr key={report.id} className="border-b">
                        <td className="py-2 px-2">{report.itemType}</td>
                        <td className="py-2 px-2">{report.itemTitle}</td>
                        <td className="py-2 px-2 text-gray-700">{report.reason}</td>
                        <td className="py-2 px-2 text-sm text-gray-500">{report.date}</td>
                        <td className="py-2 px-2 space-x-2">
                            <button className="text-sm text-blue-600 hover:underline">
                                Resolve
                            </button>
                            <button className="text-sm text-red-600 hover:underline">
                                Remove
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
