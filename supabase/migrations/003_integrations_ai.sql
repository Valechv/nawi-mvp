-- Nawi 1.3. Ejecutar DESPUÉS de 002_auto_tasks.sql. No borra tablas anteriores.
-- Credenciales y eventos solo se consultan mediante servidor con rol de servicio y autorización de empresa.
create table if not exists public.gmail_connections (
 organization_id uuid primary key references public.organizations(id) on delete cascade,
 connected_by uuid references auth.users(id) on delete set null,
 gmail_address text not null,
 refresh_token_ciphertext text not null,
 last_synced_at timestamptz,
 updated_at timestamptz not null default now()
);
create table if not exists public.whatsapp_channels (
 organization_id uuid primary key references public.organizations(id) on delete cascade,
 phone_number_id text not null unique,
 ai_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
create table if not exists public.source_events (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 lead_id uuid not null references public.leads(id) on delete cascade,
 provider text not null check (provider in ('gmail','whatsapp')),
 external_id text not null,
 summary text,
 created_at timestamptz not null default now(),
 unique(organization_id,provider,external_id)
);
create table if not exists public.ai_insights (
 lead_id uuid primary key references public.leads(id) on delete cascade,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 insight jsonb not null,
 model text not null,
 source text not null,
 updated_at timestamptz not null default now()
);
create index if not exists ai_insights_org_idx on public.ai_insights(organization_id);
alter table public.gmail_connections enable row level security;
alter table public.whatsapp_channels enable row level security;
alter table public.source_events enable row level security;
alter table public.ai_insights enable row level security;
-- Sin políticas del cliente: ni siquiera administradores de la empresa pueden leer tokens desde el navegador.
-- La interfaz consulta el estado únicamente por rutas autenticadas del servidor.
revoke all on public.gmail_connections,public.whatsapp_channels,public.source_events,public.ai_insights from anon,authenticated;
