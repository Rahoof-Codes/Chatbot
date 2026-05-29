import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";

// ─── Firebase Init ────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ─── Auth Actions ─────────────────────────────────────────────────────────────

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signOutUser = () => signOut(auth);

// ─── Auth Observer Hook ───────────────────────────────────────────────────────

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe(); // cleanup on unmount
  }, []);

  return { user, loading };
}

// ─── Firestore Types ──────────────────────────────────────────────────────────

export interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Timestamp;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt?: Timestamp;
}

// ─── Firestore: Chat Sessions ─────────────────────────────────────────────────

// Create a new chat session for a user
export async function createChatSession(
  uid: string,
  title: string = "New Chat"
): Promise<string> {
  const ref = await addDoc(collection(db, "users", uid, "chats"), {
    title,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Get all chat sessions for a user (ordered newest first)
export async function getChatSessions(uid: string): Promise<ChatSession[]> {
  const q = query(
    collection(db, "users", uid, "chats"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<ChatSession, "id">),
  }));
}

// Delete a chat session and all its messages
export async function deleteChatSession(
  uid: string,
  chatId: string
): Promise<void> {
  // Delete all messages first
  const messagesSnap = await getDocs(
    collection(db, "users", uid, "chats", chatId, "messages")
  );
  const deletions = messagesSnap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletions);

  // Then delete the session doc
  await deleteDoc(doc(db, "users", uid, "chats", chatId));
}

// ─── Firestore: Messages ──────────────────────────────────────────────────────

// Save a single message to a chat session
export async function saveMessage(
  uid: string,
  chatId: string,
  message: Omit<Message, "id">
): Promise<void> {
  await addDoc(collection(db, "users", uid, "chats", chatId, "messages"), {
    ...message,
    createdAt: serverTimestamp(),
  });
}

// Load all messages for a chat session (ordered by time)
export async function getMessages(
  uid: string,
  chatId: string
): Promise<Message[]> {
  const q = query(
    collection(db, "users", uid, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Message, "id">),
  }));
}