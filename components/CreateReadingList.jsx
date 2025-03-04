"use client";
import { useState } from "react";
import { supabase } from "@/supabaseClient";

export default function CreateReadingList() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const handleCreateList = async () => {
    const { data, error } = await supabase
      .from("reading_lists")
      .insert([
        {
          title,
          description,
          is_public: isPublic,
        },
      ])
      .single();

    if (error) {
      console.error("Error creating list:", error.message);
      return;
    }

    console.log("Reading list created:", data);
    // Optionally, redirect or update state
  };

  return (
    <div>
      <h2>Create a Reading List</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateList();
        }}
      >
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Public?
        </label>
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
