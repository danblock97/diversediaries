"use client";

import { useState } from "react";
import AuthModal from "@/components/AuthModal";

export default function Header() {
    const [modalOpen, setModalOpen] = useState(false);

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    return (
        <header className="w-full border-b border-gray-200 px-8 py-4 flex items-center justify-between relative">
            <div className="logo text-2xl font-bold">Diverse Diaries</div>
            <nav className="space-x-4">
                <a href="#" className="hover:underline">
                    Our Story
                </a>
                <a href="#" className="hover:underline">
                    Membership
                </a>
                <a href="#" className="hover:underline">
                    Write
                </a>
                <a href="#" onClick={openModal} className="hover:underline cursor-pointer">
                    Sign in
                </a>
                <button
                    onClick={openModal}
                    className="bg-black text-white px-4 py-2 rounded-full ml-2"
                >
                    Get started
                </button>
            </nav>

            {/* Render the AuthModal within the header */}
            <AuthModal isOpen={modalOpen} onClose={closeModal} />
        </header>
    );
}
