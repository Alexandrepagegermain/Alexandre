"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabaseClient";

export default function FriendsPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: fships } = await supabase
      .from("friendships")
      .select("*, requester:requester_id(username, ville), addressee:addressee_id(username, ville)")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    setFriends((fships || []).filter((f) => f.status === "accepted"));
    setReceived((fships || []).filter((f) => f.status === "pending" && f.addressee_id === user.id));
    setSent((fships || []).filter((f) => f.status === "pending" && f.requester_id === user.id));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const addId = searchParams.get("add");
    if (addId && userId) sendRequest(addId);
  }, [userId]);

  async function search() {
    if (!query.trim()) return setResults([]);
    const { data } = await supabase.from("profiles").select("id, username, ville")
      .ilike("username", `%${query}%`).neq("id", userId).limit(10);
    setResults(data || []);
  }

  async function sendRequest(addresseeId) {
    await supabase.from("friendships").insert({ requester_id: userId, addressee_id: addresseeId, status: "pending" });
    load();
  }

  async function respond(id, status) {
    await supabase.from("friendships").update({ status }).eq("id", id);
    load();
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="card">
        <h1 className="text-xl font-bold mb-3">Ajouter un ami</h1>
        <div className="flex gap-2">
          <input className="input" placeholder="Nom de profil"
            value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn" onClick={search}>Chercher</button>
        </div>
        <ul className="mt-3 text-sm space-y-2">
          {results.map((p) => (
            <li key={p.id} className="flex justify-between border-b py-2">
              <span>@{p.username} — {p.ville}</span>
              <button className="text-indigo-600 underline" onClick={() => sendRequest(p.id)}>Ajouter</button>
            </li>
          ))}
        </ul>
      </div>

      {received.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-2">Demandes reçues</h2>
          {received.map((f) => (
            <div key={f.id} className="flex justify-between border-b py-2 text-sm">
              <span>@{f.requester.username}</span>
              <div className="flex gap-3">
                <button className="text-green-600 underline" onClick={() => respond(f.id, "accepted")}>Accepter</button>
                <button className="text-red-600 underline" onClick={() => respond(f.id, "declined")}>Refuser</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sent.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-2">Demandes envoyées</h2>
          {sent.map((f) => (
            <div key={f.id} className="text-sm border-b py-2">@{f.addressee.username} — en attente</div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-2">Mes amis ({friends.length})</h2>
        <ul className="text-sm space-y-1">
          {friends.map((f) => {
            const other = f.requester_id === userId ? f.addressee : f.requester;
            return <li key={f.id}>@{other.username} — {other.ville}</li>;
          })}
        </ul>
      </div>
    </div>
  );
}
