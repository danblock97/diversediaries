"use client";

import Image from "next/image";
import { Typewriter } from "react-simple-typewriter";

export default function Home() {
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
                            "Empowering your creative voice"
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
