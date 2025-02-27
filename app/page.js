"use client";

import { useState } from "react";
import Image from "next/image";
import { Typewriter } from "react-simple-typewriter";

export default function Home() {
    // For demonstration only:
    // Switch to `true` to see the “authenticated” feed layout.
    const [isAuthenticated] = useState(true);

    if (isAuthenticated) {
        // Authenticated Layout (Feed-like UI)
        return (
            <div className="max-w-7xl mx-auto px-4 py-12 h-screen">
                {/* Top navigation for feed filtering, categories, etc. */}
                <nav className="flex items-center space-x-4 text-sm text-gray-600 mb-8">
                    <a href="#" className="font-semibold hover:underline">
                        For you
                    </a>
                    <a href="#" className="hover:underline">
                        Following
                    </a>
                    <a href="#" className="hover:underline">
                        Featured
                    </a>
                    <a href="#" className="hover:underline">
                        Staff Picks
                    </a>
                    <a href="#" className="hover:underline">
                        Software Development
                    </a>
                    {/* etc... */}
                </nav>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Column: Feed of posts */}
                    <div className="md:w-2/3 space-y-8">
                        {/* Sample Post 1 */}
                        <div className="flex flex-col border-b border-gray-200 pb-6">
                            <p className="text-sm text-gray-500 mb-2">Artificial Intelligence · 5 min read</p>
                            <h2 className="text-xl font-semibold mb-2">
                                You’re Using ChatGPT Wrong! Here’s How to be Ahead of 99% of ChatGPT Users
                            </h2>
                            <p className="text-gray-700 mb-2">
                                Master ChatGPT by learning prompt engineering...
                            </p>
                            <p className="text-sm text-gray-500">Jul 26, 2026</p>
                        </div>

                        {/* Sample Post 2 */}
                        <div className="flex flex-col border-b border-gray-200 pb-6">
                            <p className="text-sm text-gray-500 mb-2">Dmitri Ivanov · 8 min read</p>
                            <h2 className="text-xl font-semibold mb-2">
                                How does Single-Sign-On (SSO) work?
                            </h2>
                            <p className="text-gray-700 mb-2">
                                Single-Sign-On (SSO) is a crucial piece of the modern identity puzzle...
                            </p>
                            <p className="text-sm text-gray-500">Jul 25, 2026</p>
                        </div>

                        {/* Sample Post 3 */}
                        <div className="flex flex-col border-b border-gray-200 pb-6">
                            <p className="text-sm text-gray-500 mb-2">
                                Laura de Lacq · Software &amp; Startups
                            </p>
                            <h2 className="text-xl font-semibold mb-2">
                                Why Some Developers Will Never Improve
                            </h2>
                            <p className="text-gray-700 mb-2">
                                Reflecting on the habits that hold us back...
                            </p>
                            <p className="text-sm text-gray-500">Jul 24, 2026</p>
                        </div>
                    </div>

                    {/* Right Column: Sidebar with “Staff Picks”, etc. */}
                    <div className="md:w-1/3 space-y-6">
                        {/* Staff Picks */}
                        <div className="p-4 border border-gray-200 rounded">
                            <h3 className="text-lg font-bold mb-3">Staff Picks</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start">
                                    <span className="text-gray-600">1.</span>
                                    <div className="ml-2">
                                        <a href="#" className="text-gray-800 hover:underline">
                                            First-person perspectives on 3 years of remote
                                        </a>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-gray-600">2.</span>
                                    <div className="ml-2">
                                        <a href="#" className="text-gray-800 hover:underline">
                                            Negatives and Negative Capability
                                        </a>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-gray-600">3.</span>
                                    <div className="ml-2">
                                        <a href="#" className="text-gray-800 hover:underline">
                                            A guide to data inflation while you’re coding
                                        </a>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Writing on Medium box (example) */}
                        <div className="p-4 border border-gray-200 rounded">
                            <h3 className="text-lg font-bold mb-3">Writing in Medium</h3>
                            <p className="text-sm text-gray-700 mb-4">
                                Explore how to start writing, gain your audience and more...
                            </p>
                            <a href="#" className="text-sm text-green-600 hover:underline font-medium">
                                Get started
                            </a>
                        </div>

                        {/* Additional recommended topics */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-600 mb-2">
                                Recommended topics
                            </h3>
                            <ul className="flex flex-wrap gap-2 text-sm">
                                <li>
                                    <a
                                        href="#"
                                        className="bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                                    >
                                        Tech
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                                    >
                                        AI
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                                    >
                                        Self Improvement
                                    </a>
                                </li>
                                {/* etc... */}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else {
        // Non-Authenticated Layout (Your existing hero section)
        return (
            <section
                className="
          max-w-7xl mx-auto
          flex flex-col-reverse md:flex-row
          items-center justify-center
          gap-8
          px-4 py-12 md:py-20 h-screen
        "
            >
                {/* Left Column: Static Heading & Typing Effect Paragraph */}
                <div className="md:w-1/2 md:pr-8 mt-8 md:mt-0">
                    <h1 className="text-6xl md:text-7xl font-bold mb-4 leading-tight">
                        Diverse Diaries
                    </h1>
                    <p className="text-xl md:text-xl text-gray-700 mb-6">
                        <Typewriter
                            words={[
                                "A place to read, write, and deepen your understanding",
                                "Inspiring ideas at your fingertips",
                                "Empowering your creative voice",
                            ]}
                            loop={true}
                            cursor
                            cursorStyle="|"
                            typeSpeed={70}
                            deleteSpeed={50}
                            delaySpeed={2000}
                        />
                    </p>
                    <button className="bg-black text-white px-6 py-3 rounded-full">
                        Start reading
                    </button>
                </div>

                {/* Right Column: Hero Image */}
                <div className="md:w-1/2 flex justify-center md:justify-start">
                    <Image
                        src="/images/hero.png"
                        alt="Hero"
                        width={600}
                        height={400}
                        className=""
                        priority
                    />
                </div>
            </section>
        );
    }
}
