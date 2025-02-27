"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext({
    session: null,
    user: null,
    signIn: async (email) => {},
    signOut: async () => {},
    setSession: () => {},
});

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);

    // On component mount, get the current session and listen for auth state changes.
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // When the session updates (user signs in), check if a profile row exists
    useEffect(() => {
        const createProfileIfMissing = async () => {
            if (session?.user) {
                // Check if profile exists
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();
                if (error || !data) {
                    // If no profile exists, insert a new row with default values.
                    const { error: insertError } = await supabase
                        .from("profiles")
                        .insert({
                            id: session.user.id,
                            bio: "",
                            profile_picture: "",
                            preferences: {},
                        });
                    if (insertError) {
                        console.error("Error creating profile:", insertError.message);
                    }
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
        signIn,
        signOut,
        setSession, // Expose setter if needed in auth callback page.
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
