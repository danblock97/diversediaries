"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/lib/supabaseClient";
import NotificationsButton from "@/components/NotificationsButton";
import Link from "next/link";

export default function Header() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // Modal for non-auth sign in (if not authenticated)
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  // Dropdown state for authenticated header
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  // Fetch the profile to set isAdmin and profilePicture.
  useEffect(() => {
    async function fetchProfileData() {
      if (!user) return;

      try {
        const userId = user.id;

        // Fetch the profile for the current user, including profile_picture
        const { data, error } = await supabase
          .from("profiles")
          .select("is_admin, profile_picture")
          .eq("id", userId);

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        if (data && data.length > 0) {
          setIsAdmin(!!data[0].is_admin);
          setProfilePicture(data[0].profile_picture);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Exception when fetching profile:", err);
      }
    }

    fetchProfileData();
  }, [user]);

  // Handle search input changes
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchText(query);

    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      // Fetch posts that match the search query
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, user_id, created_at")
        .ilike("title", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Search error:", error);
        return;
      }

      if (!data || data.length === 0) {
        setSearchResults([]);
        setShowResults(true);
        return;
      }

      setSearchResults(data);
      setShowResults(true);
    } catch (err) {
      console.error("Search exception:", err);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Authenticated Header
  if (user) {
    return (
      <header className="w-full border-b border-gray-200 px-8 py-4 flex items-center justify-between relative">
        {/* Left side: Logo + search */}
        <div className="flex items-center space-x-4">
          <div className="logo text-2xl font-bold">
            <Link href="/">Diverse Diaries</Link>
          </div>
          <div className="hidden md:block relative" ref={searchRef}>
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
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
                placeholder="Search posts"
                className="bg-transparent focus:outline-none text-sm w-32 md:w-48"
                value={searchText}
                onChange={handleSearchChange}
              />
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute mt-1 w-80 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded shadow-md z-10">
                {searchResults.map((post) => (
                  <Link
                    href={`/posts/${post.id}`}
                    key={post.id}
                    onClick={() => {
                      setSearchText("");
                      setShowResults(false);
                    }}
                  >
                    <div className="block px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0">
                      <h4 className="font-bold text-base mb-1 truncate">
                        {post.title}
                      </h4>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span className="truncate max-w-[60%]">
                          {user && post.user_id && user.id === post.user_id
                            ? user.user_metadata?.display_name || user.email
                            : "Anonymous"}
                        </span>
                        <span className="shrink-0">
                          {post.created_at &&
                            new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {showResults &&
              searchResults.length === 0 &&
              searchText.length >= 2 && (
                <div className="absolute mt-1 w-64 bg-white border border-gray-200 rounded shadow-md z-10">
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No results found
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Right side: Write, Notification, Avatar Dropdown */}
        <div className="flex items-center space-x-6 relative">
          <a
            href="/dashboard/new"
            className="hover:underline text-sm font-medium"
          >
            Write
          </a>

          <NotificationsButton userId={user.id} />

          {/* Avatar Dropdown */}
          <div className="relative">
            <img
              src={
                profilePicture ||
                user.user_metadata?.avatar_url ||
                "/images/hero.png"
              }
              alt="User Avatar"
              className="w-8 h-8 rounded-full object-cover cursor-pointer"
              onClick={toggleDropdown}
            />
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md">
                <Link href="/dashboard">
                  <div className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Your Dashboard
                  </div>
                </Link>
                {isAdmin && (
                  <Link href="/admin">
                    <div className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Admin Dashboard
                    </div>
                  </Link>
                )}
                <button
                  onClick={async () => {
                    await signOut();
                    setDropdownOpen(false);
                    router.push("/");
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

  // Non-authenticated Header
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
