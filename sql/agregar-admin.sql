-- ============================================================
-- Anotar a un administrador (quien podrá ver y borrar respuestas en admin.html)
-- 1) Crea el usuario en Authentication > Users > Add user (Auto Confirm User)
-- 2) Cambia el correo de abajo por el de ese usuario y ejecuta: SQL Editor > Run
-- Resultado esperado: una fila con el correo anotado.
-- ============================================================
insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('tu-correo@ejemplo.com')
on conflict do nothing;

select u.email as administrador from public.admins a join auth.users u on u.id = a.user_id;
