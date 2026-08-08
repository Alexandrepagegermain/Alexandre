"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabaseClient";

export default function Nav() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <nav className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">Make Your Friends</Link>
      <div className="flex gap-4 text-sm items-center">
        {user ? (
          <>
            <Link href="/dashboard">Tableau de bord</Link>
            <Link href="/associations">Associations</Link>
            <Link href="/friends">Amis</Link>
            <Link href="/messages">Messages</Link>
            <button onClick={logout} className="underline">Déconnexion</button>
          </>
        ) : (
          <>
            <Link href="/login">Connexion</Link>
            <Link href="/signup" className="bg-white text-indigo-600 rounded-lg px-3 py-1 font-medium">
              Inscription
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
