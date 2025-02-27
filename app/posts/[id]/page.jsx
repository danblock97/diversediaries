"use client";

import Image from "next/image";

export default function PostDetailPage({ params }) {
    // For now, use static placeholder data.
    const { id } = params;
    const post = {
        title: "Sample Post Title",
        content:
            "This is the sample post content. It might eventually be rendered from markdown. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.",
        image: "/images/hero.png",
    };

    return (
        <article className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-5xl font-bold mb-6">{post.title}</h1>
            <div className="prose prose-lg mb-8">
                <p>{post.content}</p>
            </div>
            {post.image && (
                <div className="mb-8">
                    <Image
                        src={post.image}
                        alt="Post image"
                        width={800}
                        height={500}
                        className="object-cover rounded-md"
                    />
                </div>
            )}
            {/* Comments Section */}
            <section className="mt-10">
                <h2 className="text-3xl font-bold mb-4">Comments</h2>
                {/* Placeholder for comment list */}
                <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded">
                        <p className="text-gray-800">Great post!</p>
                        <p className="text-sm text-gray-500">User A · 2 hours ago</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded">
                        <p className="text-gray-800">
                            I really enjoyed reading this. Looking forward to more.
                        </p>
                        <p className="text-sm text-gray-500">User B · 4 hours ago</p>
                    </div>
                </div>
                {/* Comment Input */}
                <div className="mt-6">
          <textarea
              placeholder="Write a comment..."
              className="w-full border border-gray-300 p-3 rounded-md"
              rows="4"
          />
                    <button className="mt-2 bg-black text-white px-4 py-2 rounded">
                        Post Comment
                    </button>
                </div>
            </section>
        </article>
    );
}
