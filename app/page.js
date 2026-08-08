import Link from "next/link";

export default function Home() {
  return (
    <div className="card text-center mt-10">
      <h1 className="text-3xl font-bold mb-4">Bienvenue sur Make Your Friends</h1>
      <p className="text-gray-600 mb-6">
        Rejoignez des associations et des groupes d'activité près de chez vous,
        rencontrez de nouvelles personnes et faites-vous des amis.
      </p>
      <Link href="/signup" className="btn">Créer mon compte</Link>
    </div>
  );
}
