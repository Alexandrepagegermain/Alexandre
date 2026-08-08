"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabaseClient";

export default function AssociationDetail({ params }) {
  const supabase = createClient();
  const [assoc, setAssoc] = useState(null);
  const [members, setMembers] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [userId, setUserId] = useState(null);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id);

    const { data: a } = await supabase.from("associations").select("*").eq("id", params.id).single();
    setAssoc(a);

    const { data: m } = await supabase
      .from("association_members")
      .select("profile_id, profiles(username, ville)")
      .eq("association_id", params.id);
    setMembers(m || []);
    setIsMember((m || []).some((x) => x.profile_id === user?.id));
  }

  useEffect(() => { load(); }, [params.id]);

  async function join() {
    await supabase.from("association_members").insert({ association_id: params.id, profile_id: userId });
    load();
  }

  async function leave() {
    await supabase.from("association_members").delete()
      .eq("association_id", params.id).eq("profile_id", userId);
    load();
  }

  if (!assoc) return <p className="mt-6">Chargement...</p>;

  return (
    <div className="card mt-6 space-y-4">
      <h1 className="text-2xl font-bold">{assoc.nom}</h1>
      <p className="text-gray-500 text-sm">{assoc.ville}</p>
      <p>{assoc.description}</p>

      {isMember ? (
        <button className="btn bg-gray-500 hover:bg-gray-600" onClick={leave}>Quitter le groupe</button>
      ) : (
        <button className="btn" onClick={join}>Rejoindre</button>
      )}

      <div>
        <h2 className="font-semibold mt-4 mb-2">Membres ({members.length})</h2>
        <ul className="text-sm space-y-1">
          {members.map((m) => (
            <li key={m.profile_id}>@{m.profiles?.username} — {m.profiles?.ville}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
