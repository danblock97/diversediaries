"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

export default function Header() {
    const { user, signOut } = useAuth();
    // Simulate non-auth state for testing if needed:
    // const isAuthenticated = !!user;
    const isAuthenticated = !!user;

    // Modal for non-auth sign in (if not authenticated)
    const [modalOpen, setModalOpen] = useState(false);
    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    // Dropdown state for authenticated header
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    if (isAuthenticated) {
        return (
            <header className="w-full border-b border-gray-200 px-8 py-4 flex items-center justify-between relative">
                {/* Left side: Logo + optional search */}
                <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold">Diverse Diaries</div>
                    <div className="hidden md:flex items-center bg-gray-100 rounded-full px-3 py-2">
                        <svg
                            className="w-5 h-5 text-gray-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search"
                            className="bg-transparent focus:outline-none text-sm w-32 md:w-48"
                        />
                    </div>
                </div>

                {/* Right side: Write, Notification, Avatar Dropdown */}
                <div className="flex items-center space-x-6 relative">
                    <a href="/dashboard/new" className="hover:underline text-sm font-medium">
                        Write
                    </a>

                    <button type="button" className="relative text-gray-600 hover:text-black">
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 17h5l-1.405-1.405M19 13V8a6 6 0 10-12 0v5M13 21a2 2 0 01-2 2M12 3v1"
                            />
                        </svg>
                        {/* Optionally add a notification badge */}
                    </button>

                    {/* Avatar Dropdown */}
                    <div className="relative">
                        <img
                            src="/images/hero.png" // Replace with actual user avatar
                            alt="User Avatar"
                            className="w-8 h-8 rounded-full object-cover cursor-pointer"
                            onClick={toggleDropdown}
                        />
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md">
                                <button
                                    onClick={() => {
                                        signOut();
                                        setDropdownOpen(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        );
    }

    // Non-Authenticated Header
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
                <a
                    href="#"
                    onClick={openModal}
                    className="hover:underline cursor-pointer"
                >
                    Sign in
                </a>
                <button
                    onClick={openModal}
                    className="bg-black text-white px-4 py-2 rounded-full ml-2"
                >
                    Get started
                </button>
            </nav>
            <AuthModal isOpen={modalOpen} onClose={closeModal} />
        </header>
    );
}
