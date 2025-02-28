"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setSession } = useAuth(); // Ensure your AuthContext exports a setter if needed

  useEffect(() => {
    const handleAuth = async () => {
      // Supabase automatically parses the URL token
      const { data, error } = await supabase.auth.getSessionFromUrl();
      if (error) {
        console.error("Error getting session from URL:", error.message);
      } else {
        // Update context (if your AuthContext supports it)
        setSession(data.session);
        // Redirect to homepage after successful login
        router.push("/");
      }
    };

    handleAuth();
  }, [router, setSession]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Processing your sign in…</p>
    </div>
  );
}
