"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabaseClient";

export default function AssociationsPage() {
  const supabase = createClient();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ nom: "", description: "", ville: "" });
  const [error, setError] = useState("");

  async function load() {
    const { data } = await supabase.from("associations").select("*").order("created_at", { ascending: false });
    setList(data || []);
  }

  useEffect(() => { load(); }, []);

  async function createAssociation(e) {
    e.preventDefault();
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("associations").insert({
      nom: form.nom,
      description: form.description,
      ville: form.ville,
      created_by: user.id,
    });
    if (error) return setError(error.message);
    setForm({ nom: "", description: "", ville: "" });
    load();
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="card">
        <h1 className="text-xl font-bold mb-4">Créer une association / un groupe</h1>
        <form onSubmit={createAssociation} className="space-y-3">
          <input className="input" placeholder="Nom" required
            value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <input className="input" placeholder="Ville" required
            value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
          <textarea className="input" placeholder="Description"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button className="btn">Créer</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Toutes les associations</h2>
        <ul className="space-y-2">
          {list.map((a) => (
            <li key={a.id} className="flex justify-between border-b py-2 text-sm">
              <span>{a.nom} — {a.ville}</span>
              <Link href={`/associations/${a.id}`} className="text-indigo-600 underline">Voir</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
