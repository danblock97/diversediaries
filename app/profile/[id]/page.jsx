"use client";

import { useParams } from "next/navigation";
import PublicProfile from "@/components/PublicProfile";
import LoadingAnimation from "@/components/LoadingAnimation"; // adjust the path as needed

export default function ProfilePage() {
  const { id } = useParams();

  if (!id) return <LoadingAnimation />;

  return <PublicProfile profileId={id} />;
}
