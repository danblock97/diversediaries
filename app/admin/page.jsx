"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Admin check state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  // Dashboard state hooks
  const [activeTab, setActiveTab] = useState("overview");
  const [totalPosts, setTotalPosts] = useState(0);
  const [reportedItems, setReportedItems] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [reports, setReports] = useState([]);
  const [feedback, setFeedback] = useState([]);

  // State for ban modal
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUserToBan, setSelectedUserToBan] = useState(null);

  // Admin check effect
  useEffect(() => {
    async function checkAdmin() {
      if (!loading) {
        if (!user) {
          router.push("/");
          setAdminChecked(true);
        } else {
          const { data, error } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .maybeSingle();

          if (error || !data || !data.is_admin) {
            router.push("/");
          } else {
            setIsAdmin(true);
          }
          setAdminChecked(true);
        }
      }
    }
    checkAdmin();
  }, [user, loading, router]);

  // Data fetching effect: runs once admin is checked
  useEffect(() => {
    if (!adminChecked || !isAdmin) return;
    fetchOverviewData();
    fetchUsers();
    fetchPosts();
    fetchComments();
    fetchReports();
    fetchFeedback();
  }, [adminChecked, isAdmin]);

  async function fetchOverviewData() {
    const { count: postsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });
    const { count: reportsCount } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true });
    const { count: activeUsersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_banned", false);

    setTotalPosts(postsCount || 0);
    setReportedItems(reportsCount || 0);
    setActiveUsers(activeUsersCount || 0);
  }

  async function fetchUsers() {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      console.error("Error fetching users:", error);
      return;
    }
    const formattedUsers = data.map((u) => ({
      id: u.id,
      name: u.display_name || "No name",
      email: u.email || "No email",
      is_banned: u.is_banned ?? false,
    }));
    setUsers(formattedUsers);
  }

  async function fetchPosts() {
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("id, title, created_at, user_id");
    if (postsError) {
      console.error("Error fetching posts:", JSON.stringify(postsError));
      return;
    }
    const userIds = [...new Set(postsData.map((post) => post.user_id))];
    let authorsLookup = {};
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      if (profilesError) {
        console.error(
          "Error fetching post authors:",
          JSON.stringify(profilesError),
        );
      } else {
        profilesData.forEach((profile) => {
          authorsLookup[profile.id] = profile.display_name;
        });
      }
    }
    const formattedPosts = postsData.map((post) => ({
      id: post.id,
      title: post.title,
      author: authorsLookup[post.user_id] || "Unknown",
      date: new Date(post.created_at).toLocaleDateString(),
    }));
    setPosts(formattedPosts);
  }

  async function fetchComments() {
    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id")
      .order("created_at", { ascending: false });
    if (commentsError) {
      console.error("Error fetching comments:", JSON.stringify(commentsError));
      return;
    }
    const userIds = [
      ...new Set(commentsData.map((comment) => comment.user_id)),
    ];
    let authorsLookup = {};
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      if (profilesError) {
        console.error(
          "Error fetching comment authors:",
          JSON.stringify(profilesError),
        );
      } else {
        profilesData.forEach((profile) => {
          authorsLookup[profile.id] = profile.display_name;
        });
      }
    }
    const formattedComments = commentsData.map((comment) => ({
      id: comment.id,
      excerpt:
        comment.content.length > 50
          ? comment.content.slice(0, 50) + "..."
          : comment.content,
      author: authorsLookup[comment.user_id] || "Unknown",
      date: new Date(comment.created_at).toLocaleDateString(),
    }));
    setComments(formattedComments);
  }

  async function fetchReports() {
    const { data, error } = await supabase
      .from("reports")
      .select("id, post_id, reason, created_at, resolved, posts(title)")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching reports:", JSON.stringify(error));
      return;
    }
    const formattedReports = data.map((r) => ({
      id: r.id,
      title: r.posts ? r.posts.title : "Unknown",
      reason: r.reason,
      date: new Date(r.created_at).toLocaleDateString(),
      resolved: r.resolved,
    }));
    setReports(formattedReports);
  }

  async function fetchFeedback() {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching feedback:", JSON.stringify(error));
      return;
    }
    setFeedback(data);
  }

  // New function to remove a comment
  async function handleRemoveComment(comment) {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", comment.id);
    if (error) {
      console.error("Error removing comment:", error.message);
    } else {
      fetchComments();
    }
  }

  // Ban modal functions
  const handleBanUser = (user) => {
    setSelectedUserToBan(user);
    setBanModalOpen(true);
  };

  const confirmBanUser = async () => {
    if (!selectedUserToBan) return;
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: true })
      .eq("id", selectedUserToBan.id);
    if (error) {
      console.error("Error banning user:", error.message);
    } else {
      fetchUsers();
    }
    setBanModalOpen(false);
    setSelectedUserToBan(null);
  };

  const handleUnbanUser = async (user) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: false })
      .eq("id", user.id);
    if (error) {
      console.error("Error unbanning user:", error.message);
    } else {
      fetchUsers();
    }
  };

  // Functions for resolving and removing reports
  const handleResolveReport = async (report) => {
    const { error } = await supabase
      .from("reports")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id || null,
      })
      .eq("id", report.id);
    if (error) {
      console.error("Error resolving report:", error.message);
    } else {
      fetchReports();
    }
  };

  const handleRemoveReport = async (report) => {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", report.id);
    if (error) {
      console.error("Error removing report:", error.message);
    } else {
      fetchReports();
    }
  };

  // Function for removing a post
  const handleRemovePost = async (post) => {
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      console.error("Error removing post:", error.message);
    } else {
      fetchPosts();
    }
  };

  if (!adminChecked) {
    return <div>Loading...</div>;
  }
  if (!isAdmin) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="flex h-screen">
      <BanConfirmationModal
        isOpen={banModalOpen}
        onClose={() => {
          setBanModalOpen(false);
          setSelectedUserToBan(null);
        }}
        onConfirm={confirmBanUser}
        user={selectedUserToBan}
      />

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
          <button
            onClick={() => setActiveTab("feedback")}
            className={`text-left px-3 py-2 rounded hover:bg-gray-100 ${
              activeTab === "feedback" ? "bg-gray-200 font-semibold" : ""
            }`}
          >
            Feedback
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === "overview" && (
          <Overview
            totalPosts={totalPosts}
            reportedItems={reportedItems}
            activeUsers={activeUsers}
          />
        )}
        {activeTab === "users" && (
          <Users
            data={users}
            onBanUser={handleBanUser}
            onUnbanUser={handleUnbanUser}
          />
        )}
        {activeTab === "posts" && (
          <Posts data={posts} onRemovePost={handleRemovePost} />
        )}
        {activeTab === "comments" && (
          <Comments data={comments} onRemoveComment={handleRemoveComment} />
        )}
        {activeTab === "reports" && (
          <Reports
            data={reports}
            onResolveReport={handleResolveReport}
            onRemoveReport={handleRemoveReport}
          />
        )}
        {activeTab === "feedback" && <Feedback data={feedback} />}
      </main>
    </div>
  );
}

// Ban Confirmation Modal component
function BanConfirmationModal({ isOpen, onClose, onConfirm, user }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 max-w-sm mx-auto">
        <h3 className="text-xl font-bold mb-4">Confirm Ban</h3>
        <p className="mb-4">
          Are you sure you want to ban {user?.name || "this user"}? This action
          cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Ban User
          </button>
        </div>
      </div>
    </div>
  );
}

// Overview component
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

// Users component
function Users({ data, onBanUser, onUnbanUser }) {
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
                {user.is_banned ? (
                  <span className="text-red-500 text-sm">Banned</span>
                ) : (
                  <span className="text-green-500 text-sm">Active</span>
                )}
              </td>
              <td className="py-2 px-2 space-x-2">
                {user.is_banned ? (
                  <button
                    onClick={() => onUnbanUser(user)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Unban
                  </button>
                ) : (
                  <button
                    onClick={() => onBanUser(user)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Ban
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Posts component
function Posts({ data, onRemovePost }) {
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
              <td className="py-2 px-2">
                <button
                  onClick={() => onRemovePost(post)}
                  className="text-sm text-red-600 hover:underline"
                >
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

// Comments component with remove comment functionality
function Comments({ data, onRemoveComment }) {
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
                <button
                  onClick={() => onRemoveComment(comment)}
                  className="text-sm text-red-600 hover:underline"
                >
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

// Reports component
function Reports({ data, onResolveReport, onRemoveReport }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Reports</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2 px-2 text-sm text-gray-600">Title</th>
            <th className="py-2 px-2 text-sm text-gray-600">Reason</th>
            <th className="py-2 px-2 text-sm text-gray-600">Date</th>
            <th className="py-2 px-2 text-sm text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((report) => (
            <tr key={report.id} className="border-b">
              <td className="py-2 px-2">{report.title}</td>
              <td className="py-2 px-2 text-gray-700">{report.reason}</td>
              <td className="py-2 px-2 text-sm text-gray-500">{report.date}</td>
              <td className="py-2 px-2 space-x-2">
                {!report.resolved && (
                  <button
                    onClick={() => onResolveReport(report)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => onRemoveReport(report)}
                  className="text-sm text-red-600 hover:underline"
                >
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

// Feedback component
function Feedback({ data }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Feedback</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2 px-2 text-sm text-gray-600">Display Name</th>
            <th className="py-2 px-2 text-sm text-gray-600">Email</th>
            <th className="py-2 px-2 text-sm text-gray-600">Feedback</th>
            <th className="py-2 px-2 text-sm text-gray-600">Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td className="py-2 px-2" colSpan="4">
                No feedback available.
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-2 px-2">
                  {item.display_name || "Anonymous"}
                </td>
                <td className="py-2 px-2">{item.email || "No email"}</td>
                <td className="py-2 px-2">{item.feedback}</td>
                <td className="py-2 px-2">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
