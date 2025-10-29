"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  getIdToken,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebaseClient";

interface AuthState {
  firebaseUser: FirebaseUser | null;
  role: "user" | "admin" | null;
  providerId?: string;
  loading: boolean;
  currentStreakDays?: number;
  bestStreakDays?: number;
}

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInAdminWithEmailPassword: (
    email: string,
    password: string
  ) => Promise<void>;
  signOutAll: () => Promise<void>;
  getFreshIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start with loading false if auth is not available
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    role: null,
    loading: typeof window !== "undefined" && !!auth,
  });

  // Call mark-login endpoint after authentication
  const markLogin = async (user: FirebaseUser) => {
    try {
      const idToken = await getIdToken(user);
      const response = await fetch("/api/auth/mark-login", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setState((prev) => ({
          ...prev,
          role: data.role,
          currentStreakDays: data.currentStreakDays,
          bestStreakDays: data.bestStreakDays,
        }));
      } else {
        const errorText = await response.text();
        console.error(`Mark login failed (${response.status}):`, errorText);
        // If mark-login fails, sign out
        if (auth) await signOut(auth);
      }
    } catch (error) {
      console.error("Error marking login:", error);
      if (auth) await signOut(auth);
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Set user first
        setState((prev) => ({
          ...prev,
          firebaseUser: user,
          providerId: user.providerData[0]?.providerId,
        }));

        // Then call mark-login and wait for completion
        try {
          await markLogin(user);
        } catch (error) {
          console.error("AuthProvider: markLogin failed:", error);
          // Still set loading to false even if markLogin fails
        }

        // Only set loading to false after mark-login completes
        setState((prev) => ({
          ...prev,
          loading: false,
        }));
      } else {
        // User signed out or no user initially
        setState({
          firebaseUser: null,
          role: null,
          providerId: undefined,
          loading: false,
        });
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error("Firebase not initialized");
    await signInWithPopup(auth, googleProvider);
  };

  const signInAdminWithEmailPassword = async (
    email: string,
    password: string
  ) => {
    if (!auth) throw new Error("Firebase not initialized");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOutAll = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const getFreshIdToken = async (): Promise<string> => {
    if (!state.firebaseUser) throw new Error("No authenticated user");
    return await getIdToken(state.firebaseUser, true); // Force refresh
  };

  const value: AuthContextType = {
    ...state,
    signInWithGoogle,
    signInAdminWithEmailPassword,
    signOutAll,
    getFreshIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
