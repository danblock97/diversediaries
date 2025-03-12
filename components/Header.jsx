"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import NotificationsButton from "@/components/NotificationsButton";
import Link from "next/link";

export default function Header() {
	const { user, signOut } = useAuth();
	const router = useRouter();
	const [isAdmin, setIsAdmin] = useState(false);
	const [profilePicture, setProfilePicture] = useState(null);
	const [searchText, setSearchText] = useState("");
	const [searchResults, setSearchResults] = useState({ posts: [], people: [] });
	const [showResults, setShowResults] = useState(false);
	const searchRef = useRef(null);

	// Modal for non-auth sign in
	const [modalOpen, setModalOpen] = useState(false);
	const openModal = () => setModalOpen(true);
	const closeModal = () => setModalOpen(false);

	// Dropdown state for profile icon (authenticated header)
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

	// Mobile extra options menu state (for authenticated and non-auth mobile)
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

	// Fetch the profile data using our API route.
	useEffect(() => {
		async function fetchProfileData() {
			if (!user) return;

			try {
				const res = await fetch(`/api/profile/${user.id}`);
				const data = await res.json();
				if (data.error) {
					console.error("Error fetching profile:", data.error);
					return;
				}
				setIsAdmin(!!data.is_admin);
				setProfilePicture(data.profile_picture);
			} catch (err) {
				console.error("Exception when fetching profile:", err);
			}
		}
		fetchProfileData();
	}, [user]);

	// Handle search input changes: use the API route to search posts and people.
	const handleSearchChange = async (e) => {
		const query = e.target.value;
		setSearchText(query);

		if (query.length < 2) {
			setSearchResults({ posts: [], people: [] });
			setShowResults(false);
			return;
		}

		try {
			const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
			const data = await res.json();
			setSearchResults({
				posts: data.posts || [],
				people: data.people || [],
			});
			setShowResults(true);
		} catch (err) {
			console.error("Search exception:", err);
		}
	};

	// Close search results when clicking outside.
	useEffect(() => {
		function handleClickOutside(event) {
			if (searchRef.current && !searchRef.current.contains(event.target)) {
				setShowResults(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Load jQuery and the Jira Issue Collector script.
	useEffect(() => {
		if (typeof window !== "undefined" && !window.jQuery) {
			const jqueryScript = document.createElement("script");
			jqueryScript.src =
				"https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js";
			jqueryScript.async = true;
			document.body.appendChild(jqueryScript);
			jqueryScript.onload = loadJiraCollector;
		} else {
			loadJiraCollector();
		}

		function loadJiraCollector() {
			jQuery.ajax({
				url: "https://danblock97.atlassian.net/s/d41d8cd98f00b204e9800998ecf8427e-T/g2slup/b/9/b0105d975e9e59f24a3230a22972a71a/_/download/batch/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector-embededjs/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector-embededjs.js?locale=en-GB&collectorId=dce956ff",
				type: "get",
				cache: true,
				dataType: "script",
			});
		}

		// Use event delegation for the Jira collector trigger
		window.ATL_JQ_PAGE_PROPS = {
			triggerFunction: function (showCollectorDialog) {
				jQuery(document).on("click", "#myCustomTrigger", function (e) {
					e.preventDefault();
					showCollectorDialog();
				});
			},
		};
	}, []);

	// Authenticated Header
	if (user) {
		return (
			<header className="w-full border-b border-gray-200 px-4 md:px-8 py-4 relative">
				<div className="flex items-center justify-between">
					{/* Left side: Logo + search (search visible on desktop only) */}
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
									placeholder="Search posts and people"
									className="bg-transparent focus:outline-none text-sm w-32 md:w-48"
									value={searchText}
									onChange={handleSearchChange}
								/>
							</div>
							{showResults && (
								<div className="absolute mt-1 w-80 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded shadow-md z-10">
									{(searchResults.posts.length > 0 ||
										searchResults.people.length > 0) && (
										<div className="px-4 py-2">
											{searchResults.posts.length > 0 && (
												<>
													<p className="text-xs uppercase text-gray-400 mb-1">
														Posts
													</p>
													{searchResults.posts.map((post) => (
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
																	<span>Post</span>
																	<span className="shrink-0">
																		{post.created_at &&
																			new Date(
																				post.created_at
																			).toLocaleDateString()}
																	</span>
																</div>
															</div>
														</Link>
													))}
												</>
											)}
											{searchResults.people.length > 0 && (
												<>
													<p className="text-xs uppercase text-gray-400 mt-2 mb-1">
														People
													</p>
													{searchResults.people.map((person) => (
														<Link
															href={`/profile/${person.id}`}
															key={person.id}
															onClick={() => {
																setSearchText("");
																setShowResults(false);
															}}
														>
															<div className="block px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0">
																<div className="flex items-center gap-2">
																	{person.profile_picture ? (
																		<img
																			src={person.profile_picture}
																			alt={person.display_name}
																			className="w-6 h-6 rounded-full object-cover"
																		/>
																	) : (
																		<div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
																			{person.display_name.charAt(0)}
																		</div>
																	)}
																	<h4 className="font-bold text-base truncate">
																		{person.display_name}
																	</h4>
																</div>
																<p className="text-xs text-gray-500 truncate">
																	{person.email}
																</p>
															</div>
														</Link>
													))}
												</>
											)}
										</div>
									)}
									{showResults &&
										searchText.length >= 2 &&
										searchResults.posts.length === 0 &&
										searchResults.people.length === 0 && (
											<div className="px-4 py-2 text-sm text-gray-500">
												No results found
											</div>
										)}
								</div>
							)}
						</div>
					</div>

					{/* Desktop Authenticated Right Side (unchanged) */}
					<div className="hidden md:flex items-center space-x-6 relative">
						<Link
							href="/dashboard/new"
							className="flex items-center hover:underline text-md font-medium"
						>
							<svg
								className="w-5 h-5 mr-1"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 20h9"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"
								/>
							</svg>
							Write
						</Link>

						<a
							id="myCustomTrigger"
							className="hover:underline text-md font-medium cursor-pointer"
							onClick={() => setMobileMenuOpen(false)}
						>
							Report a Bug
						</a>

						<div className="relative">
							<NotificationsButton
								userId={user.id}
								className="w-6 h-6 text-gray-700"
							/>
						</div>

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
								<div className="absolute right-0 mt-2 w-48 max-w-[90vw] bg-white border border-gray-200 rounded shadow-md">
									<Link href="/dashboard">
										<div
											onClick={() => setDropdownOpen(false)}
											className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
										>
											<svg
												className="w-4 h-4"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M5.121 17.804A12 12 0 1118.878 6.196 12 12 0 015.121 17.804z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
												/>
											</svg>
											Profile
										</div>
									</Link>
									{isAdmin && (
										<Link href="/admin">
											<div
												onClick={() => setDropdownOpen(false)}
												className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
											>
												<svg
													className="w-4 h-4"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
													/>
												</svg>
												Admin Dashboard
											</div>
										</Link>
									)}
									<hr className="my-1 border-gray-200" />
									<Link href="/reading-lists">
										<div
											onClick={() => setDropdownOpen(false)}
											className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
										>
											<svg
												className="w-4 h-4"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M4 6h16M4 12h16M4 18h16"
												/>
											</svg>
											My Lists
										</div>
									</Link>
									<button
										onClick={async () => {
											await signOut();
											setDropdownOpen(false);
											router.push("/");
										}}
										className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
									>
										<svg
											className="w-4 h-4"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M17 16l4-4m0 0l-4-4m4 4H7"
											/>
										</svg>
										Sign out
									</button>
								</div>
							)}
						</div>
					</div>

					{/* Mobile Authenticated Right Side */}
					<div className="flex md:hidden items-center space-x-4">
						{/* Profile Icon */}
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
								<div className="absolute right-0 mt-2 w-48 max-w-[90vw] bg-white border border-gray-200 rounded shadow-md">
									<Link href="/dashboard">
										<div
											onClick={() => setDropdownOpen(false)}
											className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
										>
											<svg
												className="w-4 h-4"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M5.121 17.804A12 12 0 1118.878 6.196 12 12 0 015.121 17.804z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
												/>
											</svg>
											Profile
										</div>
									</Link>
									{isAdmin && (
										<Link href="/admin">
											<div
												onClick={() => setDropdownOpen(false)}
												className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
											>
												<svg
													className="w-4 h-4"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
													/>
												</svg>
												Admin Dashboard
											</div>
										</Link>
									)}
									<hr className="my-1 border-gray-200" />
									<Link href="/reading-lists">
										<div
											onClick={() => setDropdownOpen(false)}
											className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
										>
											<svg
												className="w-4 h-4"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M4 6h16M4 12h16M4 18h16"
												/>
											</svg>
											My Lists
										</div>
									</Link>
									<button
										onClick={async () => {
											await signOut();
											setDropdownOpen(false);
											router.push("/");
										}}
										className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
									>
										<svg
											className="w-4 h-4"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M17 16l4-4m0 0l-4-4m4 4H7"
											/>
										</svg>
										Sign out
									</button>
								</div>
							)}
						</div>
						{/* Notification Bell */}
						<NotificationsButton
							userId={user.id}
							className="w-6 h-6 text-gray-700"
						/>
						{/* Hamburger Dropdown */}
						<button onClick={toggleMobileMenu}>
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
									d="M4 6h16M4 12h16M4 18h16"
								/>
							</svg>
						</button>
					</div>
				</div>

				{/* Mobile extra options dropdown for authenticated users */}
				{mobileMenuOpen && (
					<div className="md:hidden mt-2 bg-white border-t border-gray-200 p-4 flex flex-col space-y-2">
						<Link
							href="/dashboard/new"
							onClick={() => setMobileMenuOpen(false)}
							className="hover:underline text-md font-medium"
						>
							Write
						</Link>
						<a
							id="myCustomTrigger"
							className="hover:underline text-md font-medium cursor-pointer"
							onClick={() => setMobileMenuOpen(false)}
						>
							Report a Bug
						</a>
					</div>
				)}
			</header>
		);
	}

	// Non-authenticated Header with responsive mobile menu (unchanged)
	return (
		<header className="w-full border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between relative">
			<div className="logo text-2xl font-bold">Diverse Diaries</div>
			<nav className="hidden md:flex space-x-4 items-center">
				<a
					id="myCustomTrigger"
					className="hover:underline text-md font-medium cursor-pointer pt-2"
				>
					Report a Bug
				</a>
				<a
					href="#"
					onClick={openModal}
					className="hover:underline text-md font-medium cursor-pointer pt-2"
				>
					Sign in
				</a>
				<button
					onClick={openModal}
					className="bg-black text-white px-4 py-2 rounded-full ml-2 text-md font-medium"
				>
					Get started
				</button>
			</nav>
			<div className="md:hidden">
				<button onClick={toggleMobileMenu}>
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
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>
			</div>

			{mobileMenuOpen && (
				<div className="absolute top-full left-0 w-full bg-white border-t border-gray-200 p-4 flex flex-col space-y-2 md:hidden">
					<a
						id="myCustomTrigger"
						className="hover:underline text-md font-medium cursor-pointer"
						onClick={() => setMobileMenuOpen(false)}
					>
						Report a Bug
					</a>
					<a
						href="#"
						onClick={() => {
							openModal();
							setMobileMenuOpen(false);
						}}
						className="hover:underline text-md font-medium cursor-pointer"
					>
						Sign in
					</a>
					<button
						onClick={() => {
							openModal();
							setMobileMenuOpen(false);
						}}
						className="bg-black text-white px-4 py-2 rounded-full text-md font-medium mt-4"
					>
						Get started
					</button>
				</div>
			)}

			<AuthModal isOpen={modalOpen} onClose={closeModal} />
		</header>
	);
}
