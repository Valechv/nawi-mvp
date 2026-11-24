-- NAWI v1.8 — ejecutar UNA VEZ en Supabase SQL Editor.
-- Respaldar antes. Esta migración no modifica ni elimina leads, tareas, actividades ni usuarios.
create extension if not exists pgcrypto;

create table if not exists public.nawi_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.nawi_admins enable row level security;

create or replace function public.is_nawi_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.nawi_admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_nawi_admin() from public;
grant execute on function public.is_nawi_admin() to authenticated;

-- Los administradores no pueden autoconcederse acceso: no hay políticas de escritura.
drop policy if exists nawi_admin_self_read on public.nawi_admins;
create policy nawi_admin_self_read on public.nawi_admins for select to authenticated using (user_id=(select auth.uid()));

create table if not exists public.commercial_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_type text not null check(report_type in ('diario','mensual')),
  period_start date not null,
  period_end date not null,
  title text not null check(length(title) between 3 and 180),
  summary text not null default '',
  achievements text not null default '',
  pending_actions text not null default '',
  recommendations text not null default '',
  activity_items jsonb not null default '[]'::jsonb,
  referral_items jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  evidence_note text not null default '',
  status text not null default 'borrador' check(status in ('borrador','publicado')),
  published_at timestamptz,
  delivery_status text not null default 'pendiente' check(delivery_status in ('pendiente','preparado','enviado')),
  delivery_channel text check(delivery_channel in ('whatsapp','correo')),
  delivered_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint valid_report_period check(period_end >= period_start),
  constraint valid_report_metrics check(jsonb_typeof(metrics)='object'),
  constraint valid_report_activities check(jsonb_typeof(activity_items)='array'),
  constraint valid_report_referrals check(jsonb_typeof(referral_items)='array')
);
create index if not exists commercial_reports_org_period_idx on public.commercial_reports(organization_id, period_end desc);
alter table public.commercial_reports enable row level security;

drop policy if exists reports_admin_read on public.commercial_reports;
create policy reports_admin_read on public.commercial_reports for select to authenticated using (public.is_nawi_admin());
drop policy if exists reports_client_read on public.commercial_reports;
create policy reports_client_read on public.commercial_reports for select to authenticated
 using(status='publicado' and public.is_org_member(organization_id));
drop policy if exists reports_admin_create on public.commercial_reports;
create policy reports_admin_create on public.commercial_reports for insert to authenticated
 with check(public.is_nawi_admin() and created_by=(select auth.uid()));
drop policy if exists reports_admin_edit on public.commercial_reports;
create policy reports_admin_edit on public.commercial_reports for update to authenticated
 using(public.is_nawi_admin()) with check(public.is_nawi_admin());
drop policy if exists reports_admin_delete on public.commercial_reports;
create policy reports_admin_delete on public.commercial_reports for delete to authenticated using(public.is_nawi_admin());

-- Ampliar solo la lectura de las organizaciones para el panel de operadores.
drop policy if exists org_read_admin on public.organizations;
create policy org_read_admin on public.organizations for select to authenticated using(public.is_nawi_admin());

-- Hacer inmutable la empresa asignada al informe y auditar fechas.
create or replace function public.report_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op='UPDATE' and new.organization_id is distinct from old.organization_id then
    raise exception 'No se puede transferir un informe a otra empresa';
  end if;
  if tg_op='UPDATE' and old.status='publicado' and new.status='borrador' then
    raise exception 'Un informe publicado no puede volver a borrador';
  end if;
  if new.status='publicado' and new.published_at is null then new.published_at=now(); end if;
  if new.delivery_status='enviado' and new.delivered_at is null then new.delivered_at=now(); end if;
  new.updated_at=now();
  return new;
end;$$;
drop trigger if exists commercial_reports_guard on public.commercial_reports;
create trigger commercial_reports_guard before insert or update on public.commercial_reports
for each row execute function public.report_guard();

-- IMPORTANTE: habilitar cuentas admin explícitamente mediante Supabase SQL Editor.
-- Cambia por el correo REAL de tu cuenta de Nawi, sin compartirlo en el chat:
-- insert into public.nawi_admins(user_id)
-- select id from auth.users where lower(email)=lower('TU_CORREO_DE_NAWI@EJEMPLO.COM')
-- on conflict (user_id) do nothing;
-- Repite con la cuenta de Diego si corresponde.
