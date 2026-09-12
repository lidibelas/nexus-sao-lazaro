-- Nexus — São Lázaro: acesso editorial inicial
-- Execute uma única vez no Supabase SQL Editor, como administradora do projeto.
-- Não inclui senhas, service_role keys nem permissões públicas de escrita.

create table if not exists public.editorial_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('Editora-chefe', 'Editora', 'Revisora', 'Colaboradora')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.editorial_profiles enable row level security;

-- A pessoa autenticada só pode ler o próprio perfil. Não pode criar,
-- mudar papel nem reativar a própria conta pelo navegador.
drop policy if exists "profile owner can read own profile" on public.editorial_profiles;
create policy "profile owner can read own profile"
on public.editorial_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Liberação inicial: somente a conta individual já criada para Lídia.
-- O SELECT evita depender de UID copiado manualmente.
insert into public.editorial_profiles (user_id, role, active)
select id, 'Editora-chefe', true
from auth.users
where email = 'lidiavieirabelas@gmail.com'
on conflict (user_id) do update
set role = excluded.role,
    active = excluded.active,
    updated_at = now();

-- Revogação ao fim de uma gestão (execute trocando o e-mail):
-- update public.editorial_profiles
-- set active = false, updated_at = now()
-- where user_id = (select id from auth.users where email = 'pessoa@exemplo.com');
