"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
  error: null,
  signIn: async (email) => {},
  signOut: async () => {},
  setSession: () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On mount, get the current session and listen for auth state changes.
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session);
      } catch (err) {
        console.error("Auth session error:", err.message);
        setError(err);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state change:", event);
      setSession(newSession);
      setLoading(false);
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        setError(null);
      }
      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Profile creation logic using auth metadata.
  // This upsert ensures that a profile exists (or is updated) when the user signs in.
  useEffect(() => {
    const createProfileIfMissing = async () => {
      if (session?.user) {
        try {
          const { user } = session;
          const display_name = user.user_metadata?.full_name || user.email;
          const { error } = await supabase.from("profiles").upsert({
            id: user.id,
            bio: "",
            profile_picture: "",
            preferences: {},
            display_name,
            email: user.email,
          });
          if (error && error.code !== "23505") {
            console.error("Error creating/upserting profile:", error.message);
          }
        } catch (err) {
          console.error("Profile creation error:", err.message);
        }
      }
    };

    createProfileIfMissing();
  }, [session]);

  // Sign in function using a passwordless magic link.
  const signIn = async (email) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error("Sign in error:", err.message);
      setError(err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function.
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
    } catch (err) {
      console.error("Sign out error:", err.message);
      setError(err);
    }
  };

  const value = {
    session,
    user: session?.user,
    loading,
    error,
    signIn,
    signOut,
    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
