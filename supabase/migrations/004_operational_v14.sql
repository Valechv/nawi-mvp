-- NAWI v1.4: migración ADITIVA, ejecutar después de 002 y 003.
-- No elimina empresas ni oportunidades. Restringir a datos ficticios hasta validar permisos.
ALTER TABLE public.whatsapp_channels ADD COLUMN IF NOT EXISTS access_token_ciphertext text;
ALTER TABLE public.whatsapp_channels ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
ALTER TABLE public.gmail_connections ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE public.source_events ADD COLUMN IF NOT EXISTS event_at timestamptz;
CREATE INDEX IF NOT EXISTS source_events_provider_recent_idx ON public.source_events(organization_id,provider,created_at DESC);
CREATE INDEX IF NOT EXISTS tasks_auto_open_idx ON public.tasks(organization_id,completed) WHERE auto_key IS NOT NULL;

-- Función para el servicio programado: solo autenticaciones de service_role.
-- Duplicados evitados por el índice único de 002_auto_tasks.sql.
CREATE OR REPLACE FUNCTION public.sync_all_nawi_tasks()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE n integer := 0; changed integer; r record;
BEGIN
 IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
   RAISE EXCEPTION 'Solo servicio autorizado';
 END IF;
 FOR r IN SELECT id FROM public.organizations LOOP
   UPDATE public.tasks t SET completed=true, completed_at=now()
   FROM public.leads l
   WHERE t.lead_id=l.id AND t.organization_id=r.id AND t.auto_key IS NOT NULL
     AND NOT t.completed AND (l.status IN ('Ganado','Perdido') OR l.intent='No interesado'
       OR (t.auto_key='first_contact' AND l.last_contacted_at IS NOT NULL));
   INSERT INTO public.tasks(organization_id,lead_id,title,due_at,auto_key)
   SELECT l.organization_id,l.id,'Contactar y calificar',now(),'first_contact'
   FROM public.leads l
   WHERE l.organization_id=r.id AND l.status IN ('Nuevo','Por calificar')
     AND l.last_contacted_at IS NULL AND l.intent <> 'No interesado'
   ON CONFLICT (lead_id,auto_key) WHERE auto_key IS NOT NULL DO NOTHING;
   GET DIAGNOSTICS changed=ROW_COUNT; n:=n+changed;
   INSERT INTO public.tasks(organization_id,lead_id,title,due_at,auto_key)
   SELECT l.organization_id,l.id,'Retomar seguimiento vencido',l.next_follow_up_at,'overdue_followup'
   FROM public.leads l
   WHERE l.organization_id=r.id AND l.status NOT IN ('Ganado','Perdido')
     AND l.intent <> 'No interesado' AND l.next_follow_up_at <= now()
   ON CONFLICT (lead_id,auto_key) WHERE auto_key IS NOT NULL
   DO UPDATE SET due_at=excluded.due_at,
     completed=CASE WHEN public.tasks.due_at IS DISTINCT FROM excluded.due_at THEN false ELSE public.tasks.completed END,
     completed_at=CASE WHEN public.tasks.due_at IS DISTINCT FROM excluded.due_at THEN NULL ELSE public.tasks.completed_at END;
 END LOOP;
 RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_all_nawi_tasks() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_all_nawi_tasks() TO service_role;

-- Registrar ejecuciones externas enviadas solo por usuarios autorizados.
CREATE TABLE IF NOT EXISTS public.outbound_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
 lead_id uuid NOT NULL,
 provider text NOT NULL CHECK (provider IN ('whatsapp')),
 external_id text,
 content_preview text NOT NULL,
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (lead_id,organization_id) REFERENCES public.leads(id,organization_id) ON DELETE CASCADE
);
ALTER TABLE public.outbound_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.outbound_messages FROM anon, authenticated;

-- Sincronización de Gmail opcional y desactivada por defecto.
-- El propietario debe crear en Gmail una etiqueta para correos COMERCIALES autorizados.
ALTER TABLE public.gmail_connections ADD COLUMN IF NOT EXISTS auto_sync_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.gmail_connections ADD COLUMN IF NOT EXISTS auto_sync_query text;
ALTER TABLE public.gmail_connections ADD COLUMN IF NOT EXISTS auto_ai_enabled boolean NOT NULL DEFAULT false;

-- Garantizar integridad entre origen y lead dentro de la misma empresa.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='source_events_lead_org_fk') THEN
  ALTER TABLE public.source_events ADD CONSTRAINT source_events_lead_org_fk
   FOREIGN KEY(lead_id,organization_id) REFERENCES public.leads(id,organization_id) ON DELETE CASCADE;
 END IF;
END $$;
