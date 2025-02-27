"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import "easymde/dist/easymde.min.css";

// Dynamically import react-simplemde-editor with SSR disabled
const SimpleMdeEditor = dynamic(() => import("react-simplemde-editor"), {
    ssr: false,
});

export default function NewPostPage() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-8">Create New Post</h1>
            <form className="space-y-6">
                <div>
                    <label className="block text-lg font-medium mb-2" htmlFor="title">
                        Title
                    </label>
                    <input
                        id="title"
                        type="text"
                        placeholder="Post Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-md text-lg"
                    />
                </div>
                <div>
                    <label className="block text-lg font-medium mb-2" htmlFor="content">
                        Content
                    </label>
                    <SimpleMdeEditor
                        id="content"
                        value={content}
                        onChange={setContent}
                        options={{
                            spellChecker: false,
                            placeholder: "Write your post here...",
                        }}
                    />
                </div>
                <button type="submit" className="bg-black text-white px-6 py-3 rounded-full">
                    Publish
                </button>
            </form>
        </div>
    );
}
