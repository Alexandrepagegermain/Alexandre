"use client";
import { useState } from "react";
import { createClient } from "../../lib/supabaseClient";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-10 space-y-4 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <input className="input" type="email" placeholder="Email" required
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" type="password" placeholder="Mot de passe" required
        value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button className="btn w-full" disabled={loading}>
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
