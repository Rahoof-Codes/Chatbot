"use client";

import { useAuthUser } from "@/lib/firebase";
import Chat from "@/components/Chat";
import LoginScreen from "@/components/LoginScreen";

export default function Home() {
  const { user, loading } = useAuthUser();

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return user ? <Chat user={user} /> : <LoginScreen />;
}