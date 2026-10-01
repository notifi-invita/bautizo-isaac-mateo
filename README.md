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
| `js/loader.js`, `js/sound.js`, `js/gl.js`, `js/pointer.js` | Pantalla de carga, efectos de sonido, WebGL (foto y luces) y detalles de mouse |
| `tools/` | Scripts para volver a generar el título caligráfico (no se cargan en la página) |
| `css/` y `fonts/` | Estilos y tipografías (alojadas en el sitio) |
| `img/` | Acuarelas (ramo de esquina, corona, osito, ramita y palomas en 4 cuadros), portada para WhatsApp (`og.jpg`) y tus fotos |
| `vendor/` | GSAP 3.15 con sus plugins, Lenis y Supabase (incluidos para no depender de otros servidores) |
| `setup.sql` | Crea la tabla y las reglas de seguridad en Supabase |
| `sql/` | Verificación de seguridad y consultas útiles para Supabase |

## 1 · Activar GitHub Pages (una sola vez)

En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
En uno o dos minutos la invitación queda en el enlace de arriba.

## 2 · Base de datos en Supabase (unos 5 minutos)

1. Crea un proyecto en https://supabase.com (región sugerida: São Paulo).
2. **SQL Editor → New query** → pega todo `setup.sql` → **Run**.
3. Para comprobar: pega `sql/verificar.sql` → **Run**. Debe salir `invitado_puede_leer` e `invitado_puede_borrar` en `false`, lo demás en `true` y `reglas = 3`.
4. Botón **Connect** (arriba) o **Project Settings → API Keys**: copia **Project URL** y la **Publishable key** (`sb_publishable_…`; la antigua *anon* también sirve) en `js/config.js` (`SUPABASE_URL` y `SUPABASE_ANON_KEY`). Nunca uses la *secret key*.
5. **Authentication → Users → Add user → Create new user**: tu correo y contraseña, marca **Auto Confirm User**. Luego anótalo como administrador con `sql/agregar-admin.sql` (cambia el correo y **Run**). Solo los usuarios anotados ven y borran respuestas.
6. **Authentication → Sign In / Providers**: desactiva **Allow new users to sign up**.
7. Opcional: `sql/consultas.sql` tiene consultas para ver respuestas y totales directo en Supabase.

La clave publishable/*anon* es pública por diseño; la seguridad la dan las reglas de `setup.sql` (los invitados solo pueden enviar, nunca leer).

## 3 · Foto y música

- **Foto del círculo dorado:** súbela a `img/` (por ejemplo `img/isaac.jpg`, idealmente cuadrada y menor a 400 KB) y escribe esa ruta en `mainPhoto`.
- **Música:** sube el archivo como `musica.mp3` a la carpeta principal. Empieza con un fundido suave al tocar el sello; quien prefiera silencio toca «Abrir sin música». Si el archivo no existe, el aviso «con música» se oculta solo (los efectos de sonido siguen disponibles).
- **Galería (opcional):** `photos: ["img/foto1.jpg", "img/foto2.jpg"]`.

Para editar desde el navegador: abre el archivo en GitHub → ícono del lápiz → cambia → **Commit changes**. Para subir fotos: **Add file → Upload files** dentro de `img/`.

## Enlaces personalizados

Agrega `?para=` y el sobre muestra el nombre del invitado:

```
https://notifi-invita.github.io/bautizo-isaac-mateo/?para=Familia%20Pérez
```

## Cómo funciona la confirmación

- Una sola respuesta por **nombre + apellido** (sin importar mayúsculas, tildes ni espacios). Para corregir una, elimínala en el panel y la persona puede volver a enviar.
- Fecha límite: **domingo 4 de octubre** a las 23:59 (hora de Ecuador). La invitación muestra «Las confirmaciones ya están cerradas» y, además, la base de datos rechaza cualquier respuesta posterior con su propio reloj (aunque el celular tenga otra fecha). Para cambiarla: `rsvpDeadline` en `js/config.js` **y** la fecha de la regla «invitados pueden enviar» en `setup.sql`.
- Quien no puede asistir elige o escribe una frase de buenos deseos; la ves en la columna **Mensaje** del panel.
- **Plato de la recepción:** quien marca «Con gusto asistiré» toca «Continuar al menú» y en un segundo paso elige un solo plato por persona (él y cada acompañante): *Pollo al horno* o *Cuy asado*. El panel muestra el total de cada plato y el Excel trae una columna por plato. Los nombres se cambian en `menu` dentro de `js/config.js`.

## Animaciones

Hechas con GSAP 3.15 (Physics2D, DrawSVG, SplitText, MotionPath, ScrollTrigger), Lenis para el scroll suave en computadora y WebGL propio (sin librerías) para la foto y las luces.

- **Carga:** el monograma «IM» se dibuja al ritmo de lo que realmente falta por cargar (fuentes, acuarelas, foto). Al terminar aparece el sobre con dos opciones: tocar el sello (con música) o «Abrir sin música».
- **Apertura:** el sello se agrieta y se parte en dos con gravedad real, la solapa se abre en 3D, la carta sale, el sobre baja y se desvanece, la carta viaja al centro y un destello cálido revela la tarjeta.
- **Tarjeta:** las flores aparecen por capas desde las esquinas, los marcos dorados se dibujan, la foto aparece con un revelado líquido de borde dorado (WebGL), la corona gira suavemente hasta su lugar, las palomas en acuarela llegan volando con aleteo cuadro a cuadro y se posan, y «Bautizo» se escribe a mano letra por letra.
- **Al bajar:** cada sección se revela en orden con la misma familia de curvas; el reloj de paletas cuenta en vivo.
- **Al confirmar:** «Gracias» se escribe a mano, se sueltan palomas y cae una lluvia suave de pétalos.
- **Oro vivo:** el dorado brilla según la inclinación del celular o el movimiento del mouse.
- **Luces:** partículas doradas con profundidad (las cercanas grandes y desenfocadas, las lejanas pequeñas) que suben despacio y acompañan el scroll.
- **Sonidos sutiles:** crujido del lacre, papel, destello, aleteo y un arpegio al confirmar. Se generan en el navegador (no se descarga nada) y el botón de música los apaga también.
- **En computadora:** cursor propio (dice «Abrir» sobre el sello), botones magnéticos cuyo relleno nace desde el mouse, texto que rueda a cursiva y la foto ondula como agua al pasar encima.

**Rendimiento:** solo se animan propiedades que la tarjeta gráfica mueve sin esfuerzo (posición, escala, opacidad); las acuarelas van optimizadas en WebP con transparencia. En celulares modestos se activa un modo ligero automático (sin WebGL ni luces), y quien tenga activado «reducir movimiento» ve todo sin animaciones. Para probar sin WebGL agrega `?gl=0` al enlace.

**Anti-spam:** el formulario tiene un campo invisible y descarta envíos hechos en menos de 3 segundos.

## Probar en tu computador

```
python -m http.server 8000
```
Abre http://localhost:8000. Sin Supabase configurado, el formulario funciona en modo vista previa (no guarda nada).

Créditos: tipografías Pinyon Script, Playfair Display y Questrial (licencia OFL); animación con GSAP (licencia estándar gratuita).
