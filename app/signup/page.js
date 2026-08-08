"use client";
import { useState } from "react";
import { createClient } from "../../lib/supabaseClient";

export default function SignupPage() {
  const supabase = createClient();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    username: "",
    ville: "",
    password: "",
    majeur: false,
    cgu: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.majeur) return setError("Vous devez confirmer être majeur.");
    if (!form.cgu) return setError("Vous devez accepter les conditions d'utilisation.");
    if (form.password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères.");

    setLoading(true);

    // Vérifie que le nom de profil est disponible avant de créer le compte
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", form.username)
      .maybeSingle();

    if (existing) {
      setLoading(false);
      return setError("Ce nom de profil est déjà pris.");
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          nom: form.nom,
          prenom: form.prenom,
          username: form.username,
          ville: form.ville,
          majeur: form.majeur,
          cgu_accepted: form.cgu,
        },
      },
    });

    setLoading(false);
    if (signUpError) return setError(signUpError.message);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card mt-10 text-center">
        <h1 className="text-2xl font-bold mb-2">Vérifiez votre boîte mail 📩</h1>
        <p className="text-gray-600">
          Un e-mail de confirmation a été envoyé à <b>{form.email}</b>. Cliquez sur le lien
          qu'il contient pour finaliser la création de votre compte.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
      <h1 className="text-2xl font-bold">Créer un compte</h1>

      <div className="grid grid-cols-2 gap-4">
        <input className="input" placeholder="Nom" required
          value={form.nom} onChange={(e) => update("nom", e.target.value)} />
        <input className="input" placeholder="Prénom" required
          value={form.prenom} onChange={(e) => update("prenom", e.target.value)} />
      </div>

      <input className="input" type="email" placeholder="Email" required
        value={form.email} onChange={(e) => update("email", e.target.value)} />

      <input className="input" placeholder="Nom de profil (unique)" required
        value={form.username} onChange={(e) => update("username", e.target.value)} />

      <input className="input" placeholder="Ville" required
        value={form.ville} onChange={(e) => update("ville", e.target.value)} />

      <input className="input" type="password" placeholder="Mot de passe" required
        value={form.password} onChange={(e) => update("password", e.target.value)} />

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={form.majeur}
          onChange={(e) => update("majeur", e.target.checked)} />
        Je certifie être majeur(e).
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={form.cgu}
          onChange={(e) => update("cgu", e.target.checked)} />
        J'accepte les <a href="/cgu" className="text-indigo-600 underline">conditions d'utilisation</a>.
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button className="btn w-full" disabled={loading}>
        {loading ? "Création..." : "S'inscrire"}
      </button>
    </form>
  );
}
