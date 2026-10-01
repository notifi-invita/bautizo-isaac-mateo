-- ============================================================
-- PASO 2 · Verificar que todo quedó bien (solo lee, no cambia nada)
-- Supabase > SQL Editor > New query > pega > Run
--
-- Resultado esperado (una sola fila):
--   tabla_creada            = true
--   seguridad_activa        = true
--   invitado_puede_enviar   = true
--   invitado_puede_leer     = false   <- importante: los invitados no ven respuestas
--   invitado_puede_borrar   = false
--   admin_puede_leer        = true
--   admin_puede_borrar      = true
--   reglas                  = 3
--   administradores         = 1 o más (si es 0, ejecuta sql/agregar-admin.sql)
--   columnas_de_platos      = true   (pollo y cuy)
--   regla_de_platos         = true   (cada persona un solo plato)
--   verificacion_de_retorno = true   (rsvp_exists, para quien vuelve a abrir la invitación)
-- ============================================================
select
  to_regclass('public.rsvps') is not null                                          as tabla_creada,
  (select relrowsecurity from pg_class where oid = 'public.rsvps'::regclass)       as seguridad_activa,
  has_table_privilege('anon', 'public.rsvps', 'INSERT')
    or has_any_column_privilege('anon', 'public.rsvps', 'INSERT')                  as invitado_puede_enviar,
  has_table_privilege('anon', 'public.rsvps', 'SELECT')
    or has_any_column_privilege('anon', 'public.rsvps', 'SELECT')                  as invitado_puede_leer,
  has_table_privilege('anon', 'public.rsvps', 'DELETE')                            as invitado_puede_borrar,
  has_table_privilege('authenticated', 'public.rsvps', 'SELECT')                   as admin_puede_leer,
  has_table_privilege('authenticated', 'public.rsvps', 'DELETE')                   as admin_puede_borrar,
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'rsvps') as reglas,
  (select count(*) from public.admins) as administradores,
  (select count(*) = 2 from information_schema.columns where table_schema = 'public' and table_name = 'rsvps' and column_name in ('pollo', 'cuy')) as columnas_de_platos,
  exists (select 1 from pg_constraint where conrelid = 'public.rsvps'::regclass and conname = 'rsvps_platos_check') as regla_de_platos,
  (to_regprocedure('public.rsvp_exists(uuid)') is not null
     and has_function_privilege('anon', 'public.rsvp_exists(uuid)', 'EXECUTE')) as verificacion_de_retorno;
