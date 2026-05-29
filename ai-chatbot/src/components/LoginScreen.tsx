"use client";

import { signInWithGoogle } from "@/lib/firebase";
import { Globe } from "lucide-react";
import { useState } from "react";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-dvh items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">AI Chatbot</h1>
            <p className="mt-1 text-sm text-gray-400">
              Sign in to start chatting
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow transition hover:bg-gray-100 active:scale-95 disabled:opacity-60"
        >
          <Globe className="h-5 w-5 text-indigo-600" />
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="mt-6 text-center text-xs text-gray-600">
          Your chats are saved securely to your account.
        </p>
      </div>
    </div>
  );
}