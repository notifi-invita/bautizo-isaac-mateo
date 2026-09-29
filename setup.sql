-- ============================================================
-- PASO 1 · Crear la tabla de confirmaciones y sus reglas
-- Bautizo de Isaac Mateo
--
-- Supabase > SQL Editor > New query > pega TODO > Run
-- Resultado esperado: "Success. No rows returned"
-- Se puede ejecutar más de una vez sin problema (no borra datos).
-- ============================================================

create table if not exists public.rsvps (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null check (char_length(btrim(first_name)) between 2 and 60),
  last_name   text not null check (char_length(btrim(last_name))  between 2 and 60),
  attending   boolean not null default true,
  guests      int not null default 0 check (guests between 0 and 10),
  -- Clave para detectar repetidos: ignora mayúsculas, tildes y espacios extra
  name_key    text generated always as (
                lower(
                  translate(
                    regexp_replace(btrim(first_name) || ' ' || btrim(last_name), '\s+', ' ', 'g'),
                    'áéíóúüñÁÉÍÓÚÜÑ',
                    'aeiouunAEIOUUN'
                  )
                )
              ) stored,
  created_at  timestamptz not null default now(),
  constraint rsvps_name_key_unique unique (name_key)
);

-- Mensaje o buenos deseos del invitado (máximo 500 caracteres)
alter table public.rsvps
  add column if not exists message text check (message is null or char_length(message) <= 500);

-- Seguridad: los invitados solo pueden enviar; solo el administrador con sesión puede leer y borrar
alter table public.rsvps enable row level security;

-- Permisos explícitos (los proyectos nuevos de Supabase ya no los dan solos)
grant usage on schema public to anon, authenticated;
revoke all on public.rsvps from anon, authenticated;
grant insert (first_name, last_name, attending, guests, message) on public.rsvps to anon;
grant select, delete on public.rsvps to authenticated;

drop policy if exists "invitados pueden enviar" on public.rsvps;
create policy "invitados pueden enviar"
  on public.rsvps for insert to anon
  with check (true);

drop policy if exists "admin puede leer" on public.rsvps;
create policy "admin puede leer"
  on public.rsvps for select to authenticated
  using (true);

drop policy if exists "admin puede borrar" on public.rsvps;
create policy "admin puede borrar"
  on public.rsvps for delete to authenticated
  using (true);
