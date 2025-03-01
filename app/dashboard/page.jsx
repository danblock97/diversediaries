"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    display_name: "",
    email: "",
    bio: "",
    profile_picture: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch the user's profile on mount
  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email, bio, profile_picture")
        .eq("id", user.id)
        .single();
      if (error) {
        console.error("Error fetching profile:", error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [user]);

  // Handle changes for text inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file input change
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    // Define the file path in your storage bucket
    const filePath = `profile-pictures/${user.id}/${file.name}`;

    // Upload the file to the "profile-pictures" bucket
    const { data, error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading image:", uploadError.message);
      setMessage("Error uploading image: " + uploadError.message);
      setUploading(false);
      return;
    }

    // Get the public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    if (!urlData) {
      console.error("Error getting public URL");
      setMessage("Error getting image URL");
      setUploading(false);
      return;
    }

    const publicURL = urlData.publicUrl;

    // Update the profile_picture in state and in the profiles table
    setProfile((prev) => ({ ...prev, profile_picture: publicURL }));

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ profile_picture: publicURL })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile picture:", updateError.message);
      setMessage("Error updating profile picture: " + updateError.message);
    } else {
      setMessage("Profile picture updated successfully!");
    }
    setUploading(false);
  };

  // Handle form submission for updating text fields
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
      })
      .eq("id", user.id);
    if (error) {
      setMessage("Error updating profile: " + error.message);
    } else {
      setMessage("Profile updated successfully!");
    }
    setUpdating(false);
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Your Dashboard</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Display profile picture */}
        <div className="flex flex-col items-center">
          {profile.profile_picture ? (
            <img
              src={profile.profile_picture}
              alt="Profile Picture"
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 flex items-center justify-center">
              No Image
            </div>
          )}
          <label className="cursor-pointer bg-blue-500 text-white px-3 py-1 rounded">
            {uploading ? "Uploading..." : "Change Profile Picture"}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="block mb-1 font-semibold" htmlFor="display_name">
            Display Name
          </label>
          <input
            type="text"
            id="display_name"
            name="display_name"
            value={profile.display_name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={profile.email}
            readOnly
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows="4"
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={updating}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {updating ? "Updating..." : "Update Profile"}
        </button>
        {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
      </form>
    </div>
  );
}
