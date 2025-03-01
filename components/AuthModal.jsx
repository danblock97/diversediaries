"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function AuthModal({ isOpen, onClose }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [banned, setBanned] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);

    // Check if a profile with this email is banned.
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("email", email)
      .single();

    if (profileData && profileData.is_banned) {
      setBanned(true);
      setLoading(false);
      return;
    }

    // If not banned, send the magic link.
    const { error } = await signIn(email);
    setLoading(false);
    if (!error) {
      setSent(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred, dark overlay */}
      <div
        className="absolute inset-0 bg-black opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg max-w-4xl w-full mx-4 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left Side: Text, Email Input & Button */}
          <div className="md:w-1/2 p-8 flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-4">Sign In</h2>
            {banned ? (
              <>
                <p className="text-gray-700 mb-4">
                  Unfortunately, your account has been banned. For more
                  information, please email{" "}
                  <a
                    href="mailto:danblock1997@hotmail.co.uk"
                    className="underline text-blue-600"
                  >
                    Diverse Diaries Support
                  </a>
                  .
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-700 mb-4">
                  Enter your email to receive a magic link.
                </p>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-md text-lg mb-4"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || sent}
                  className="w-full bg-black text-white px-6 py-3 rounded-full disabled:opacity-50"
                >
                  {loading
                    ? "Sending..."
                    : sent
                      ? "Link Sent"
                      : "Send Magic Link"}
                </button>
              </>
            )}
          </div>

          {/* Right Side: Hero Image */}
          <div className="md:w-1/2">
            <Image
              src="/images/hero.png"
              alt="Authentication Hero"
              width={600}
              height={400}
              className="object-cover"
            />
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
