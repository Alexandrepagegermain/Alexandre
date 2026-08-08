"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabaseClient";

export default function MessagesPage() {
  const supabase = createClient();
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: fships } = await supabase
        .from("friendships")
        .select("*, requester:requester_id(id, username), addressee:addressee_id(id, username)")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const list = (fships || []).map((f) =>
        f.requester_id === user.id ? f.addressee : f.requester
      );
      setFriends(list);
    })();
  }, []);

  return (
    <div className="card mt-6">
      <h1 className="text-xl font-bold mb-4">Messages</h1>
      {friends.length === 0 && (
        <p className="text-gray-500 text-sm">
          Vous n'avez pas encore d'amis. Ajoutez des amis pour pouvoir leur écrire.
        </p>
      )}
      <ul className="space-y-2">
        {friends.map((f) => (
          <li key={f.id} className="border-b py-2">
            <Link href={`/messages/${f.id}`} className="text-indigo-600 underline">
              @{f.username}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
