-- NAWI v1.2: migración ADITIVA. Ejecutar en el SQL Editor del MISMO Supabase.
-- Mantiene intactas las empresas, leads y tareas existentes.
-- Nunca utilices la service_role key en el navegador.

alter table public.tasks add column if not exists auto_key text;
create unique index if not exists tasks_one_auto_kind_per_lead_idx
 on public.tasks(lead_id,auto_key) where auto_key is not null;

-- La función se ejecuta con los permisos del usuario y respeta políticas RLS.
create or replace function public.sync_organization_tasks(p_org uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare v_added integer := 0; v_step integer := 0;
begin
  if (select auth.uid()) is null or not public.is_org_member(p_org) then
    raise exception 'Sin autorización para esta empresa';
  end if;

  -- Cierra tareas automáticas cuando el lead ya se cerró.
  update public.tasks t set completed=true, completed_at=now()
  from public.leads l
  where t.lead_id=l.id and t.organization_id=p_org
    and t.auto_key is not null and not t.completed
    and (l.status in ('Ganado','Perdido') or l.intent='No interesado'
       or (t.auto_key='first_contact' and l.last_contacted_at is not null));

  -- Una sola tarea por lead nuevo, sin contacto registrado.
  insert into public.tasks(organization_id,lead_id,title,due_at,auto_key)
  select l.organization_id,l.id,'Contactar y calificar',now(),'first_contact'
  from public.leads l
  where l.organization_id=p_org and l.status in ('Nuevo','Por calificar')
    and l.last_contacted_at is null and l.intent<>'No interesado'
  on conflict (lead_id,auto_key) where auto_key is not null do nothing;
  get diagnostics v_step=row_count;v_added:=v_added+v_step;

  -- Seguimientos vencidos, sin duplicar tareas ya registradas.
  insert into public.tasks(organization_id,lead_id,title,due_at,auto_key)
  select l.organization_id,l.id,'Retomar seguimiento vencido',l.next_follow_up_at,'overdue_followup'
  from public.leads l
  where l.organization_id=p_org and l.status not in ('Ganado','Perdido')
    and l.intent<>'No interesado'
    and l.next_follow_up_at <= now()
  on conflict (lead_id,auto_key) where auto_key is not null
  do update set due_at=excluded.due_at,
    completed=case when public.tasks.due_at is distinct from excluded.due_at then false else public.tasks.completed end,
    completed_at=case when public.tasks.due_at is distinct from excluded.due_at then null else public.tasks.completed_at end;
  get diagnostics v_step=row_count;v_added:=v_added+v_step;

  return v_added;
end;
$$;
revoke all on function public.sync_organization_tasks(uuid) from public;
grant execute on function public.sync_organization_tasks(uuid) to authenticated;
