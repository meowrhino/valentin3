# Cómo mantener valentinbarrio.com

Guía paso a paso para añadir, modificar o borrar contenido de la web sin tocar código.

**Regla de oro:** todo se hace en **`data.json`** y archivos dentro de **`_PROJECTS/`**. El código (`index.html`, `css/style.css`, `js/main.js`, `404.html`) no hay que tocarlo nunca.

---

## ⚠️ LÉEME PRIMERO

### Qué tocar y qué NO tocar
- ✅ **Sí puedes tocar:** `data.json`, los archivos dentro de `_PROJECTS/` (imágenes y audios)
- ❌ **Mejor no toques:** `index.html`, `404.html`, `css/style.css`, `js/main.js` (si no sabes qué haces, se rompe)
- Si tocas algo por error, **no guardes**, cierra sin guardar y vuelve a abrir

### La web necesita un servidor para funcionar en local
No sirve abrir `index.html` con doble click. Hay que servirla:
```bash
python3 -m http.server 8090
# luego abrir http://localhost:8090
```
(Solo para probar en tu ordenador. En GitHub Pages funciona automático.)

### Formatos
- **Imágenes:** siempre `.webp`. Ancho recomendado 1200–2000 px, peso ideal < 400 KB.
- **Audios:** `.opus` o `.mp3`. Lo que tengas a mano.
- **Nombre de archivos:** numerados `1.webp`, `2.webp`, `3.webp`… sin saltos.

### Caché del navegador
Si cambias algo y al abrir la web sigues viendo lo viejo: es la caché.
**Refrescar con Ctrl+F5** (Windows) o **Cmd+Shift+R** (Mac).

---

## Cómo subir los cambios al sitio real

Todo lo que edites en este repo se sube a la web con 3 pasos en GitHub:

### Desde la web de GitHub (lo más fácil)
1. Entra a https://github.com/meowrhino/valentin3
2. Click en el archivo que quieres editar (ej. `data.json`) → botón lápiz ✏️
3. Edita, y al final de la página pulsa **Commit changes**

### Subir archivos nuevos (imágenes, audios)
1. Entra a la carpeta donde va (ej. `_PROJECTS/bolder/`)
2. Pulsa **Add file → Upload files**
3. Arrastra el archivo y pulsa **Commit changes**

En pocos minutos GitHub Pages refresca la web automáticamente.

> Si usas VS Code o cualquier editor con git: `git add -A && git commit -m "update" && git push`

---

## Estructura del repo

```
valentin3/
├── index.html          ← shell de la página (no tocar)
├── 404.html            ← mismo shell para URLs profundas (no tocar)
├── data.json           ← ⭐ la configuración de toda la web
├── css/
│   └── style.css       ← estilos (no tocar)
├── js/
│   └── main.js         ← lógica SPA (no tocar)
├── fonts/              ← fuente Outfit local (no tocar)
├── assets/
│   └── navicon.png     ← favicon
├── _PROJECTS/          ← ⭐ los archivos de cada proyecto
│   ├── _valentin/      ← el "about", es un proyecto más
│   ├── bolder/
│   ├── brunch/
│   └── …
└── README.md           ← este archivo
```

---

## Cómo funciona la web, en 30 segundos

- **Home** (`/`): cabecera + lista de tiras (una por proyecto). Al llegar al final se siguen generando aleatoriamente (infinite scroll).
- **Proyecto** (`/bolder`, `/lynn`, etc.): margen superior con un punto, ficha técnica + descripción, galería vertical de imágenes (con textos y audios intercalados si los hay), margen inferior con otro punto, y botón **back to home** al final.
- **About** (`/_valentin`): es un proyecto más, pero en lugar de aparecer al final de la home sale el primero. Bajo el botón de home tiene además un enlace a `meowrhino.studio`.
- **Transición**: al clicar una tira se abre un círculo negro desde el punto, cubre todo, y al llegar a la nueva página se abre otro círculo que la descubre desde el centro. Al volver, el círculo que descubre se abre desde el punto de la tira del proyecto que acabas de ver.
- **Lightbox**: al clicar una foto del proyecto se amplía en pantalla completa. Se cierra con ESC, click fuera, o las X de las esquinas. Flechas ← → para ir a la anterior/siguiente.

---

## PROYECTOS (lo que más vas a tocar)

Cada proyecto necesita **una carpeta en `_PROJECTS/`** con sus imágenes **y una entrada en `data.json`** dentro del array `projects`.

### ➕ Añadir un proyecto nuevo

Imagina que se llama **"Mi Proyecto"** y su identificador (slug) va a ser **`mi-proyecto`** (sin espacios, sin tildes, minúsculas, solo letras, números y guiones).

**1. Crea la carpeta y sube las fotos:**
```
_PROJECTS/mi-proyecto/
├── 1.webp
├── 2.webp
├── 3.webp
└── …
```
Las imágenes deben estar numeradas de forma consecutiva empezando en 1.

**2. Añade el proyecto a `data.json`** dentro del array `projects`:
```json
{
  "slug": "mi-proyecto",
  "nombre": "Mi Proyecto",
  "imgHome": 1,
  "imgCount": 8,
  "tipo": "festival",
  "lugar": "Barcelona",
  "fecha": "may. 26",
  "descripcion": "Lo que quieras contar del proyecto."
}
```
No te olvides de la coma al final del proyecto anterior.

| Campo | Qué es |
|---|---|
| `slug` | Identificador interno. **Debe coincidir con el nombre de la carpeta en `_PROJECTS/`**. Solo minúsculas, números y guiones. |
| `nombre` | Título visible en el proyecto y en la pestaña del navegador |
| `imgHome` | Número de la imagen que se usa de portada en la tira de la home (ej. `1` → `1.webp`) |
| `imgCount` | Cuántas imágenes tiene el proyecto en total |
| `tipo` | Tipo de trabajo: `press`, `club`, `festival`, etc. Aparece en la ficha técnica |
| `lugar` | Dónde se hizo. Aparece en la ficha |
| `fecha` | Cuándo se hizo. Aparece en la ficha |
| `descripcion` | Texto bajo el título del proyecto |

### ✏️ Modificar un proyecto
Abre `data.json`, busca el proyecto, edita los campos que quieras. Si cambias el `slug`, **renombra también la carpeta** en `_PROJECTS/` para que coincida.

### ❌ Borrar un proyecto
1. Borra su entrada del array `projects` en `data.json` (ojo con las comas).
2. Borra la carpeta correspondiente de `_PROJECTS/`.

### 🔄 Cambiar el orden de los proyectos
El orden en la home es el mismo que en el array `projects` de `data.json`. Mueve los objetos para reordenar.

> El `_valentin` (about) siempre aparece primero, independientemente del orden.

---

## GALERÍA RICA (con textos y audios intercalados)

Si un proyecto solo tiene imágenes, basta con `imgCount` y se muestran todas numeradas. Pero si quieres **intercalar textos o audios**, añade un campo `contenido` con la lista exacta de bloques:

```json
{
  "slug": "ejemplo",
  "nombre": "Ejemplo",
  "imgHome": 1,
  "tipo": "press",
  "lugar": "Barcelona",
  "fecha": "feb. 26",
  "descripcion": "…",
  "contenido": [
    { "tipo": "imagen", "src": 1 },
    { "tipo": "imagen", "src": 2 },
    { "tipo": "texto",  "texto": "Una cita que divide la galería." },
    { "tipo": "imagen", "src": 3 },
    { "tipo": "audio",  "src": "nota-de-voz.opus" },
    { "tipo": "imagen", "src": 4 }
  ]
}
```

| Tipo de bloque | Campos |
|---|---|
| `imagen` | `src`: número de la imagen dentro de la carpeta (ej. `3` → `3.webp`) |
| `texto`  | `texto`: la frase a mostrar (aparece centrada, en cursiva) |
| `audio`  | `src`: nombre del archivo de audio dentro de la carpeta del proyecto |

> Cuando usas `contenido`, el campo `imgCount` **se ignora**. El orden y la selección los decides con los bloques `imagen` del array.

---

## EQUIPO / CRÉDITOS

Si un proyecto tuvo colaboradores, añade un array `equipo` al objeto del proyecto:

```json
"equipo": [
  { "nombre": "Rivka",  "rol": "photo assist & 2nd camera" },
  { "nombre": "Juanjo", "rol": "styling" }
]
```

Cada entrada aparece en la ficha técnica. Si dejas `rol` vacío, se muestra como "team".

---

## ABOUT (`_valentin`)

Es un proyecto más, pero en `data.json` vive fuera del array `projects`, dentro de la clave `about`. Soporta todo lo mismo (ficha, `contenido` con imágenes + textos + audios, equipo).

### ✏️ Cambiar la bio, ubicación o tipo
Editar `data.json` → `about`:
```json
"about": {
  "slug": "_valentin",
  "nombre": "valentin barrio",
  "imgHome": 3,
  "tipo": "Photography, Art Direction, Visual Storytelling",
  "lugar": "Barcelona",
  "descripcion": "Photographer and visual artist based in Barcelona…",
  "contenido": [ … ]
}
```

> El slug `_valentin` empieza por `_` aposta para distinguirlo. Si lo cambias, **renombra también la carpeta** `_PROJECTS/_valentin/`.

---

## CABECERA DE LA HOME (nombre, tagline, email)

Se edita en `data.json` → `meta`:
```json
"meta": {
  "nombre": "valentin barrio",
  "tagline": "creative based in europe",
  "email": "email@work.com"
}
```

---

## FAVICON

El iconito de la pestaña del navegador está en `assets/navicon.png`. Reemplázalo con otro PNG del mismo nombre para cambiarlo.

---

## ⚠️ Errores comunes

| Síntoma | Causa probable |
|---|---|
| La web no carga nada | Error de sintaxis en `data.json` — una coma de más, una comilla sin cerrar. Valida con https://jsonlint.com |
| Una imagen no se ve | El `slug` del proyecto no coincide con el nombre de la carpeta, o falta el archivo numerado (`3.webp`). |
| La portada del proyecto es otra | Cambia `imgHome` al número de la imagen que quieras usar. |
| El audio no suena | El `src` del bloque no coincide con el nombre exacto del archivo dentro de la carpeta del proyecto. Atento a mayúsculas/minúsculas y espacios. |
| Los cambios no se ven | Caché del navegador. Ctrl+F5 (Windows) o Cmd+Shift+R (Mac). |
| Al entrar directamente a `/bolder` da 404 | Solo en local con `python3 -m http.server`. En GitHub Pages sí funciona gracias a `404.html`. |

---

## Verificar que todo funciona

Abre la web y la consola del navegador (F12 o Cmd+Opt+I):
- No debería haber errores en rojo
- Si falta algún archivo, aparece un warning con la ruta exacta

---

## Ante cualquier duda

Guarda copia de `data.json` antes de hacer cambios grandes. Si algo se rompe, restaurándolo vuelve todo a estar OK.

La web la hizo **manu (@meowrhino)**. Si algo se rompe y no sabes arreglarlo, contacta.
