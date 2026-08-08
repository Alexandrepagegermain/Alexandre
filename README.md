# Make Your Friends

Site de rencontres amicales : inscription, associations/groupes d'activité
suggérés par ville, ajout d'amis, messagerie privée réservée aux amis.

Stack : **Next.js 14 (App Router)** + **Supabase** (Auth, Postgres, Realtime) + **Vercel**.

## 1. Créer le projet Supabase

1. Va sur https://supabase.com → **New project**.
2. Une fois créé, ouvre **SQL Editor** et colle le contenu de `supabase/schema.sql`, puis exécute-le.
   Cela crée les tables `profiles`, `associations`, `association_members`, `friendships`, `messages`,
   le trigger qui crée automatiquement un profil à l'inscription, et toutes les policies RLS.
3. Dans **Authentication → Providers**, laisse "Email" activé.
4. Dans **Authentication → URL Configuration** :
   - Site URL : `http://localhost:3000` en local, puis ton domaine Vercel une fois déployé.
   - Redirect URLs : ajoute `http://localhost:3000/auth/callback` et `https://TON-DOMAINE.vercel.app/auth/callback`.
5. Dans **Authentication → Email Templates → Confirm signup**, tu peux personnaliser le mail de confirmation.
6. Récupère tes clés dans **Project Settings → API** : `Project URL` et `anon public key`.

## 2. Lancer en local

```bash
npm install
cp .env.local.example .env.local
# colle NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local
npm run dev
```

Ouvre http://localhost:3000

## 3. Mettre le code sur GitHub

```bash
git init
git add .
git commit -m "Initial commit - Make Your Friends"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/make-your-friends.git
git push -u origin main
```

(Crée d'abord le repo vide sur https://github.com/new — ne coche aucune case
d'initialisation pour éviter les conflits avec `git push`.)

## 4. Déployer sur Vercel

1. Va sur https://vercel.com/new et importe le repo GitHub `make-your-friends`.
2. Dans **Environment Variables**, ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://TON-DOMAINE.vercel.app`
3. Clique **Deploy**.
4. Une fois déployé, retourne dans Supabase → Authentication → URL Configuration et
   mets à jour Site URL + Redirect URLs avec le vrai domaine Vercel.

## Fonctionnalités incluses

- Inscription : nom, prénom, email, nom de profil unique, ville, case "majeur",
  acceptation des CGU → e-mail de confirmation envoyé automatiquement par Supabase Auth.
- Connexion / déconnexion.
- Tableau de bord avec associations suggérées selon la ville du profil.
- Création et consultation d'associations/groupes, avec bouton "Rejoindre".
- Recherche par nom de profil ou nom d'association.
- Système d'amis : demande, acceptation, refus.
- Messagerie privée en temps réel, **autorisée uniquement entre amis** (vérifié
  côté base de données via Row Level Security, pas seulement côté interface).

## Pistes d'amélioration

- Géolocalisation précise : ajouter l'extension PostGIS et des colonnes `lat`/`lng`
  sur `profiles` et `associations` pour trier par distance réelle plutôt que par
  simple correspondance de ville.
- Upload de photo de profil (Supabase Storage).
- Notifications (nouvelle demande d'ami, nouveau message).
- Modération des signalements.
- Vraies CGU rédigées par un juriste avant mise en production.

