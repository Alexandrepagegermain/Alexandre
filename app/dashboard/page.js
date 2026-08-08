"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabaseClient";

export default function Dashboard() {
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ profiles: [], associations: [] });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(p);
      if (p) {
        const { data: assoc } = await supabase
          .from("associations")
          .select("*")
          .ilike("ville", p.ville)
          .limit(10);
        setNearby(assoc || []);
      }
    })();
  }, []);

  async function search() {
    if (!query.trim()) return setResults({ profiles: [], associations: [] });
    const [{ data: profiles }, { data: associations }] = await Promise.all([
      supabase.from("profiles").select("id, username, ville").ilike("username", `%${query}%`).limit(10),
      supabase.from("associations").select("id, nom, ville").ilike("nom", `%${query}%`).limit(10),
    ]);
    setResults({ profiles: profiles || [], associations: associations || [] });
  }

  return (
    <div className="space-y-6 mt-6">
      {profile && (
        <div className="card">
          <h1 className="text-xl font-bold">Bonjour {profile.prenom} 👋</h1>
          <p className="text-gray-500 text-sm">@{profile.username} · {profile.ville}</p>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-2">Rechercher un profil ou une association</h2>
        <div className="flex gap-2">
          <input className="input" placeholder="Nom de profil ou d'association"
            value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn" onClick={search}>Chercher</button>
        </div>

        {(results.profiles.length > 0 || results.associations.length > 0) && (
          <div className="mt-4 space-y-2 text-sm">
            {results.profiles.map((p) => (
              <div key={p.id} className="flex justify-between items-center border-b py-2">
                <span>👤 @{p.username} — {p.ville}</span>
                <Link href={`/friends?add=${p.id}`} className="text-indigo-600 underline">Ajouter en ami</Link>
              </div>
            ))}
            {results.associations.map((a) => (
              <div key={a.id} className="flex justify-between items-center border-b py-2">
                <span>🏷️ {a.nom} — {a.ville}</span>
                <Link href={`/associations/${a.id}`} className="text-indigo-600 underline">Voir / Rejoindre</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">
          Associations près de vous {profile ? `(${profile.ville})` : ""}
        </h2>
        {nearby.length === 0 && <p className="text-gray-500 text-sm">Aucune association trouvée dans votre ville pour le moment.</p>}
        <ul className="space-y-2">
          {nearby.map((a) => (
            <li key={a.id} className="flex justify-between border-b py-2 text-sm">
              <span>{a.nom}</span>
              <Link href={`/associations/${a.id}`} className="text-indigo-600 underline">Voir</Link>
            </li>
          ))}
        </ul>
        <Link href="/associations" className="text-indigo-600 underline text-sm block mt-3">
          Voir toutes les associations →
        </Link>
      </div>
    </div>
  );
}
