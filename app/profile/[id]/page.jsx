"use client";

import { useParams } from "next/navigation";
import PublicProfile from "@/components/PublicProfile"; // adjust the path as needed

export default function ProfilePage() {
  const { id } = useParams();

  if (!id) return <p>Loading...</p>;

  return <PublicProfile profileId={id} />;
}
