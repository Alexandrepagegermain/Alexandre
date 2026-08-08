-- ============================================================
-- MAKE YOUR FRIENDS — Schéma Supabase (à coller dans SQL Editor)
-- ============================================================

-- Extension utile pour recherche insensible aux accents/majuscules
create extension if not exists pg_trgm;

-- ---------- PROFILES ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text not null,
  prenom text not null,
  username text not null unique,
  ville text not null,
  majeur boolean not null default false,
  cgu_accepted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists profiles_username_trgm on profiles using gin (username gin_trgm_ops);
create index if not exists profiles_ville_idx on profiles (ville);

-- Empêche la création d'un compte si la personne n'a pas coché majeur/CGU
alter table profiles add constraint majeur_requis check (majeur = true);
alter table profiles add constraint cgu_requises check (cgu_accepted = true);

-- ---------- ASSOCIATIONS / GROUPES ----------
create table if not exists associations (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  description text,
  ville text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists associations_nom_trgm on associations using gin (nom gin_trgm_ops);
create index if not exists associations_ville_idx on associations (ville);

create table if not exists association_members (
  association_id uuid references associations(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (association_id, profile_id)
);

-- ---------- AMIS ----------
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade,
  addressee_id uuid references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

-- ---------- MESSAGES PRIVÉS ----------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_pair_idx on messages (least(sender_id, receiver_id), greatest(sender_id, receiver_id), created_at);

-- Fonction : les 2 personnes sont-elles amies (statut accepted) ?
create or replace function are_friends(a uuid, b uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$;

-- ---------- TRIGGER : créer le profil à l'inscription ----------
-- Les infos (nom, prenom, username, ville, majeur, cgu_accepted) sont passées
-- via options.data lors de supabase.auth.signUp(...) côté client (voir app/signup).
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nom, prenom, username, ville, majeur, cgu_accepted)
  values (
    new.id,
    new.raw_user_meta_data->>'nom',
    new.raw_user_meta_data->>'prenom',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'ville',
    coalesce((new.raw_user_meta_data->>'majeur')::boolean, false),
    coalesce((new.raw_user_meta_data->>'cgu_accepted')::boolean, false)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table associations enable row level security;
alter table association_members enable row level security;
alter table friendships enable row level security;
alter table messages enable row level security;

-- PROFILES : tout le monde connecté peut lire (pour la recherche/annuaire),
-- chacun ne modifie que son propre profil.
create policy "profiles_select_all" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
-- L'insertion se fait uniquement via le trigger (security definer), pas de policy insert publique.

-- ASSOCIATIONS : lecture publique aux connectés, création par un utilisateur connecté.
create policy "assoc_select_all" on associations for select using (auth.role() = 'authenticated');
create policy "assoc_insert_auth" on associations for insert with check (auth.uid() = created_by);

-- MEMBERS : lecture publique, un utilisateur ne peut s'ajouter/se retirer que lui-même.
create policy "members_select_all" on association_members for select using (auth.role() = 'authenticated');
create policy "members_insert_self" on association_members for insert with check (auth.uid() = profile_id);
create policy "members_delete_self" on association_members for delete using (auth.uid() = profile_id);

-- FRIENDSHIPS : on ne voit que les demandes qui nous concernent.
create policy "friend_select_own" on friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friend_insert_own" on friendships for insert
  with check (auth.uid() = requester_id);
create policy "friend_update_addressee" on friendships for update
  using (auth.uid() = addressee_id or auth.uid() = requester_id);

-- MESSAGES : lecture/écriture seulement entre deux personnes amies (accepted),
-- et seulement ses propres conversations.
create policy "messages_select_own" on messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "messages_insert_if_friends" on messages for insert
  with check (auth.uid() = sender_id and are_friends(sender_id, receiver_id));
