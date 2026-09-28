# Invitación de bautizo · Isaac Mateo

Invitación web animada con confirmación de asistencia. Las respuestas se guardan en **Supabase** y solo las ve el administrador en `admin.html`.

**Enlace público:** https://notifi-invita.github.io/bautizo-isaac-mateo/

## Qué hay en cada carpeta

| Ruta | Para qué sirve |
|---|---|
| `index.html` | La invitación |
| `admin.html` | Panel privado con las respuestas |
| `js/config.js` | **Aquí cambias textos, fechas, foto, música y claves** |
| `js/app.js`, `js/motion.js`, `js/rsvp.js`, `js/art.js` | Contenido, animaciones (GSAP), confirmación e ilustraciones |
| `css/` y `fonts/` | Estilos y tipografías (alojadas en el sitio) |
| `img/` | Acuarelas pre-renderizadas, portada para WhatsApp (`og.jpg`) y tus fotos |
| `vendor/` | GSAP 3.15 y Supabase (incluidos para no depender de otros servidores) |
| `setup.sql` | Crea la tabla y las reglas de seguridad en Supabase |

## 1 · Activar GitHub Pages (una sola vez)

En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
En uno o dos minutos la invitación queda en el enlace de arriba.

## 2 · Base de datos en Supabase (unos 5 minutos)

1. Crea un proyecto en https://supabase.com (región sugerida: São Paulo).
2. **SQL Editor → New query** → pega todo `setup.sql` → **Run**.
3. **Project Settings → API**: copia **Project URL** y **anon public key** en `js/config.js` (`SUPABASE_URL` y `SUPABASE_ANON_KEY`).
4. **Authentication → Users → Add user**: tu correo y contraseña, marca **Auto Confirm User**.
5. **Authentication → Sign In / Providers**: desactiva **Allow new users to sign up**.

La clave *anon* es pública por diseño; la seguridad la dan las reglas de `setup.sql` (los invitados solo pueden enviar, nunca leer).

## 3 · Foto y música

- **Foto del círculo dorado:** súbela a `img/` (por ejemplo `img/isaac.jpg`, idealmente cuadrada y menor a 400 KB) y escribe esa ruta en `mainPhoto`.
- **Música:** sube el archivo como `musica.mp3` a la carpeta principal. Empieza con un fundido suave al tocar el sello. Si no existe, el botón de música se oculta solo.
- **Galería (opcional):** `photos: ["img/foto1.jpg", "img/foto2.jpg"]`.

Para editar desde el navegador: abre el archivo en GitHub → ícono del lápiz → cambia → **Commit changes**. Para subir fotos: **Add file → Upload files** dentro de `img/`.

## Enlaces personalizados

Agrega `?para=` y el sobre muestra el nombre del invitado:

```
https://notifi-invita.github.io/bautizo-isaac-mateo/?para=Familia%20Pérez
```

## Cómo funciona la confirmación

- Una sola respuesta por **nombre + apellido** (sin importar mayúsculas, tildes ni espacios). Para corregir una, elimínala en el panel y la persona puede volver a enviar.
- Fecha límite: **domingo 4 de octubre** (`rsvpDeadline` en `js/config.js`).
- Quien no puede asistir elige o escribe una frase de buenos deseos; la ves en la columna **Mensaje** del panel.

## Animaciones

Sello de cera que se rompe, solapa 3D, carta que se convierte en la página, flores de acuarela en capas, título escrito a mano, oro que brilla según la inclinación del celular, cinta que se despliega, reloj de paletas, secciones que se pintan al bajar, paloma que cruza con el scroll, hojas que caen y suelta de palomas al confirmar.

En celulares modestos se activa un **modo ligero** automático (menos partículas y efectos), y quien tenga activado "reducir movimiento" ve la invitación sin animaciones.

## Probar en tu computador

```
python -m http.server 8000
```
Abre http://localhost:8000. Sin Supabase configurado, el formulario funciona en modo vista previa (no guarda nada).

Créditos: tipografías Pinyon Script, Playfair Display y Questrial (licencia OFL); animación con GSAP (licencia estándar gratuita).
