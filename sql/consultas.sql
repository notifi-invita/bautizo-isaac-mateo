-- ============================================================
-- Consultas útiles (opcional). El panel admin.html ya muestra todo esto;
-- aquí queda por si prefieres verlo directo en Supabase.
-- Supabase > SQL Editor > selecciona SOLO la consulta que quieras > Run
-- ============================================================

-- A) Todas las respuestas, de la más reciente a la más antigua
select
  to_char(created_at at time zone 'America/Guayaquil', 'DD/MM/YYYY HH24:MI') as fecha,
  first_name  as nombre,
  last_name   as apellido,
  case when attending then 'Sí asistirá' else 'No podrá' end               as respuesta,
  guests      as acompanantes,
  message     as mensaje
from public.rsvps
order by created_at desc;

-- B) Totales para el conteo del evento
select
  count(*) filter (where attending)                         as familias_que_asisten,
  coalesce(sum(guests + 1) filter (where attending), 0)     as personas_en_total,
  count(*) filter (where not attending)                     as no_podran_asistir,
  count(*)                                                  as respuestas
from public.rsvps;

-- C) Borrar una respuesta (por ejemplo, tu prueba).
--    Escribe el nombre y apellido en minúsculas y sin tildes, quita los "--" y ejecuta SOLO esa línea:
-- delete from public.rsvps where name_key = 'nombre apellido';
