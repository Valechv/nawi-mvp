-- Nawi v2.0: panel comparativo asociado a cada informe; no publica ni importa datos automáticamente.
-- Ejecutar después de 005_reports_portal_v18.sql. No borra informes existentes.
alter table public.commercial_reports
  add column if not exists pilot_snapshot jsonb;

alter table public.commercial_reports drop constraint if exists valid_report_pilot_snapshot;
alter table public.commercial_reports
  add constraint valid_report_pilot_snapshot
    check (pilot_snapshot is null or jsonb_typeof(pilot_snapshot) = 'object');

comment on column public.commercial_reports.pilot_snapshot is
  'Evidencia agregada antes/durante o histórica; visible a empresa solo tras publicar el informe. No hay registros personales.';
