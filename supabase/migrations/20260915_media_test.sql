-- Nexus — Teste de ponta a ponta: tabelas media_assets e submissions
-- Execute no SQL Editor do Supabase.
-- Cria o catálogo de mídia (media_assets) e a fila de submissões (submissions).

-- ============================================================
-- media_assets: catálogo de ativos de mídia do Nexus
-- ============================================================

create table if not exists public.media_assets (
  asset_id            text primary key,
  original_provider   text not null default 'google_drive',
  provider_file_id    text,
  original_path       text,
  mime_type           text not null,
  file_size           bigint,
  original_filename   text,
  checksum            text,
  privacy             text not null default 'private',
  public_derivative_url  text,
  derivative_status   text not null default 'pending',
  derivative_mime     text,
  derivative_size     bigint,
  created_at          timestamptz not null default now(),
  created_by          uuid,
  updated_at          timestamptz not null default now()
);

create index if not exists idx_media_assets_provider_file_id
  on public.media_assets(provider_file_id);

create index if not exists idx_media_assets_derivative_status
  on public.media_assets(derivative_status);

-- ============================================================
-- submissions: fila de submissões da comunidade
-- ============================================================

create table if not exists public.submissions (
  id              uuid primary key default gen_random_uuid(),
  asset_id        text references public.media_assets(asset_id),
  submission_type text not null,
  title           text,
  description     text,
  sender_name     text,
  sender_email    text,
  sender_connection text,
  metadata        jsonb,
  status          text not null default 'pendente',
  reviewed_by     uuid,
  reviewed_at     timestamptz,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_submissions_status
  on public.submissions(status);

create index if not exists idx_submissions_asset_id
  on public.submissions(asset_id);

-- ============================================================
-- Função para gerar asset_id sequencial (NX-MEDIA-000001)
-- ============================================================

create or replace function public.generate_asset_id()
returns text as $$
declare
  next_val int;
begin
  select coalesce(max(
    cast(
      regexp_replace(asset_id, 'NX-MEDIA-', '') as int
    )
  ), 0) + 1
  into next_val
  from public.media_assets
  where asset_id ~ '^NX-MEDIA-[0-9]+$';

  return 'NX-MEDIA-' || lpad(next_val::text, 6, '0');
end;
$$ language plpgsql security definer;

-- ============================================================
-- Trigger: updated_at automático
-- ============================================================

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_media_assets_touch on public.media_assets;
create trigger trg_media_assets_touch
  before update on public.media_assets
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_submissions_touch on public.submissions;
create trigger trg_submissions_touch
  before update on public.submissions
  for each row execute function public.touch_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

alter table public.media_assets enable row level security;
alter table public.submissions enable row level security;

-- media_assets: leitura pública para derivados publicados, escrita só autenticado
drop policy if exists "public can read published derivatives" on public.media_assets;
create policy "public can read published derivatives"
  on public.media_assets for select
  to anon, authenticated
  using (privacy = 'public' and derivative_status = 'generated');

drop policy if exists "authenticated can read all" on public.media_assets;
create policy "authenticated can read all"
  on public.media_assets for select
  to authenticated
  using (true);

drop policy if exists "authenticated can insert" on public.media_assets;
create policy "authenticated can insert"
  on public.media_assets for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated can update" on public.media_assets;
create policy "authenticated can update"
  on public.media_assets for update
  to authenticated
  using (true) with check (true);

-- submissions: escrita pública (qualquer pessoa pode enviar), leitura só autenticado
drop policy if exists "anyone can submit" on public.submissions;
create policy "anyone can submit"
  on public.submissions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "authenticated can read submissions" on public.submissions;
create policy "authenticated can read submissions"
  on public.submissions for select
  to authenticated
  using (true);

drop policy if exists "authenticated can update submissions" on public.submissions;
create policy "authenticated can update submissions"
  on public.submissions for update
  to authenticated
  using (true) with check (true);