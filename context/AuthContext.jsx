"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext({
    session: null,
    user: null,
    loading: true,
    signIn: async (email) => {},
    signOut: async () => {},
    setSession: () => {},
});

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, get the current session and listen for auth state changes.
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // When the session updates (user signs in), check if a profile row exists.
    // When the session updates (user signs in), check if a profile row exists
    useEffect(() => {
        const createProfileIfMissing = async () => {
            if (session?.user) {
                // Upsert will insert if missing, or do nothing if already exists
                const { error } = await supabase
                    .from("profiles")
                    .upsert({
                        id: session.user.id,
                        bio: "",
                        profile_picture: "",
                        preferences: {},
                    });
                if (error && error.code !== "23505") { // 23505 is the unique violation error code
                    console.error("Error creating/upserting profile:", error.message);
                }
            }
        };

        createProfileIfMissing();
    }, [session]);

    // Sign in function using passwordless magic link.
    const signIn = async (email) => {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
            console.error("Sign in error:", error.message);
        }
        return { error };
    };

    // Sign out function.
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Sign out error:", error.message);
        }
        setSession(null);
    };

    const value = {
        session,
        user: session?.user,
        loading,
        signIn,
        signOut,
        setSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
