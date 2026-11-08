-- ═══════════════════════════════════════════════════════════
-- ALMA PROYECT · Fase 1a — Guardado de recorridos por usuaria
-- Ejecutar en Supabase: SQL Editor → New query → pegar → Run
-- ═══════════════════════════════════════════════════════════

-- 1) Tabla de recorridos: una fila por usuaria anónima y día.
--    "data" guarda exactamente el mismo objeto que hoy vive en
--    el navegador (texto, historial de turnos, respuesta de Alma),
--    para que la futura restauración sea un espejo perfecto.
create table if not exists journey_days (
  id          bigint generated always as identity primary key,
  anon_id     uuid not null,
  day         text not null check (day in ('beta','1','2','3')),
  data        jsonb not null,
  arrival_mode text,
  claimed     boolean not null default false,  -- true cuando deje su correo (fase 1b)
  user_id     uuid,                            -- se rellenará al reclamar (fase 1b)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (anon_id, day)
);

create index if not exists journey_days_anon_idx on journey_days (anon_id);
create index if not exists journey_days_purge_idx on journey_days (claimed, created_at);

-- 2) Cerrar la tabla al mundo: RLS activado y sin políticas públicas.
--    Solo las funciones del servidor (con la service key) pueden tocarla.
alter table journey_days enable row level security;

-- 3) Borrado automático: los recorridos no reclamados se borran
--    solos a los 14 días, tal y como promete el aviso.
--    Requiere la extensión pg_cron: en Supabase, Database →
--    Extensions → buscar "pg_cron" → Enable (esquema por defecto).
--    Después, ejecutar este bloque:
select cron.schedule(
  'alma-borrar-recorridos-no-reclamados',
  '15 4 * * *',  -- todos los días a las 04:15 UTC
  $$ delete from journey_days where claimed = false and created_at < now() - interval '14 days' $$
);

-- Para comprobar que el trabajo quedó programado:
--   select jobname, schedule, active from cron.job;
-- Para eliminarlo si algún día hiciera falta:
--   select cron.unschedule('alma-borrar-recorridos-no-reclamados');
