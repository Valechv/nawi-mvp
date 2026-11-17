-- NAWI MVP v1.0 — ejecutar una sola vez en Supabase > SQL Editor.
-- IMPORTANTE: no usar service_role en el frontend. Todas las tablas de datos tienen RLS.
create extension if not exists pgcrypto;

create table if not exists public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 2 and 120),
 created_at timestamptz not null default now()
);
create table if not exists public.memberships (
 organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'owner' check(role in ('owner','member')),
 created_at timestamptz not null default now(),
 primary key(organization_id,user_id)
);
create index if not exists membership_user_idx on public.memberships(user_id);

-- Función para evitar recursión de políticas RLS sobre memberships.
create or replace function public.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.memberships m where m.organization_id=p_org and m.user_id=(select auth.uid()));
$$;
revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;

create table if not exists public.leads (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null check(length(name) between 1 and 180), phone text, email text,
 source text not null default 'Manual', service text, status text not null default 'Nuevo'
 check(status in ('Nuevo','Por calificar','Contactado','Seguimiento','Cotización','Ganado','Perdido')),
 intent text not null default 'Sin información' check(intent in ('Sin información','Interés general','Precio o cotización','Compra explícita','No interesado')),
 urgency text not null default 'Desconocida' check(urgency in ('Desconocida','Inmediata','Este mes','Más adelante')),
 assigned_to uuid references auth.users(id) on delete set null,
 last_contacted_at timestamptz, next_follow_up_at timestamptz, notes text,
 value_estimate numeric(12,2), created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists leads_org_created_idx on public.leads(organization_id,created_at desc);
create index if not exists leads_org_status_idx on public.leads(organization_id,status);

create unique index if not exists leads_id_org_unique on public.leads(id,organization_id);

create table if not exists public.activities (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 lead_id uuid not null, actor_id uuid references auth.users(id) on delete set null,
 action text not null, detail text, created_at timestamptz not null default now(),
 foreign key (lead_id,organization_id) references public.leads(id,organization_id) on delete cascade
);

create table if not exists public.tasks (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 lead_id uuid not null, title text not null, due_at timestamptz,
 completed boolean not null default false, completed_at timestamptz,
 created_at timestamptz not null default now(),
 foreign key (lead_id,organization_id) references public.leads(id,organization_id) on delete cascade
);
create index if not exists tasks_org_due_idx on public.tasks(organization_id,due_at);

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.leads enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "org_read" on public.organizations;
create policy "org_read" on public.organizations for select to authenticated using(public.is_org_member(id));
drop policy if exists "member_read" on public.memberships;
create policy "member_read" on public.memberships for select to authenticated using(public.is_org_member(organization_id));
drop policy if exists "lead_read" on public.leads;
create policy "lead_read" on public.leads for select to authenticated using(public.is_org_member(organization_id));
drop policy if exists "lead_add" on public.leads;
create policy "lead_add" on public.leads for insert to authenticated with check(public.is_org_member(organization_id));
drop policy if exists "lead_edit" on public.leads;
create policy "lead_edit" on public.leads for update to authenticated using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
drop policy if exists "lead_remove" on public.leads;
create policy "lead_remove" on public.leads for delete to authenticated using(public.is_org_member(organization_id));
drop policy if exists "activity_read" on public.activities;
create policy "activity_read" on public.activities for select to authenticated using(public.is_org_member(organization_id));
drop policy if exists "activity_add" on public.activities;
create policy "activity_add" on public.activities for insert to authenticated with check(public.is_org_member(organization_id) and actor_id=(select auth.uid()));
drop policy if exists "task_read" on public.tasks;
create policy "task_read" on public.tasks for select to authenticated using(public.is_org_member(organization_id));
drop policy if exists "task_add" on public.tasks;
create policy "task_add" on public.tasks for insert to authenticated with check(public.is_org_member(organization_id));
drop policy if exists "task_edit" on public.tasks;
create policy "task_edit" on public.tasks for update to authenticated using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
drop policy if exists "task_remove" on public.tasks;
create policy "task_remove" on public.tasks for delete to authenticated using(public.is_org_member(organization_id));

-- Crear organización + vincular propietario atómicamente, sin permisos directos de INSERT en organizaciones/memberships.
create or replace function public.create_organization(p_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_org uuid;
begin
 if (select auth.uid()) is null then raise exception 'Autenticación requerida'; end if;
 if length(trim(coalesce(p_name,''))) < 2 or length(trim(p_name)) > 120 then raise exception 'Nombre de empresa inválido'; end if;
 insert into public.organizations(name) values(trim(p_name)) returning id into v_org;
 insert into public.memberships(organization_id,user_id,role) values(v_org,(select auth.uid()),'owner');
 return v_org;
end;
$$;
revoke all on function public.create_organization(text) from public;
grant execute on function public.create_organization(text) to authenticated;

-- Evitar que los usuarios cambien el tenant de un lead o falsifiquen campos sensibles.
create or replace function public.lead_org_immutable()
returns trigger language plpgsql set search_path = '' as $$
begin
 if new.organization_id is distinct from old.organization_id then raise exception 'No se puede transferir lead a otra empresa'; end if;
 new.updated_at=now(); return new;
end;
$$;
drop trigger if exists protect_lead_org on public.leads;
create trigger protect_lead_org before update on public.leads for each row execute function public.lead_org_immutable();

-- Vínculo opcional: solo propietarios pueden invitar usuarios ya registrados por email desde el SQL editor o futuras funciones protegidas.
-- La aplicación v1 no gestiona invitaciones.

-- Protect assignment: assigned user must be in the same organization.
create or replace function public.validate_lead_assignee()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.assigned_to is not null and not exists (
   select 1 from public.memberships m
   where m.organization_id=new.organization_id and m.user_id=new.assigned_to
 ) then raise exception 'Responsable no pertenece a esta empresa'; end if;
 return new;
end; $$;
drop trigger if exists check_lead_assignee on public.leads;
create trigger check_lead_assignee before insert or update on public.leads
for each row execute function public.validate_lead_assignee();
