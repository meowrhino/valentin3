# Cómo mantener valentinbarrio.com

> **Regla de oro: solo se tocan `data/site.json` y `projects/`** (y los vídeos de `data/banners/`).
> El código (`index.html`, `css/`, `js/`, `build/`) no hay que tocarlo.

## Qué hay

```
data/site.json             el nombre, la línea de debajo, el email, el instagram, cuál es el
                           "about", y la home de arriba abajo ("lists" → "home")
data/banners/              los vídeos decorativos que van entre proyectos en la home
projects/<nombre>/         un proyecto, una carpeta:
  project.json               su título, su ficha y su texto
  portada.webp               la tira de la home
  1.webp, 2.webp…            las fotos, seguidas
```

El **nombre de la carpeta** es también la dirección: `projects/bolder/` → `valentinbarrio.com/bolder/`.
Mejor no cambiarlo una vez publicado.

## La primera vez: preparar VS Code

1. En VS Code: **Archivo → Nueva ventana** → **Clonar repositorio Git…** → **Clonar desde GitHub**.
2. Instala **Live Server** cuando VS Code lo proponga. Abajo a la derecha sale **Go Live**: es la
   vista previa, y si algo está mal lo dice en pantalla.

**VS Code te ayuda con los campos**: si pasas el ratón por encima de uno te dice qué es, y si
escribes uno mal lo subraya en rojo. Lo sabe por la primera línea de cada JSON (`"$schema": …`):
**no la borres**.

## Añadir un proyecto

1. **Copia una carpeta** de `projects/` y ponle el nombre nuevo (minúsculas, números y guiones).
   Borra sus fotos.
2. **Las fotos**: pásalas por [imgToWeb](https://meowrhino.github.io/imgToWeb/) (en Chrome o
   Firefox): salen `1.webp`, `2.webp`… en el orden en que las arrastras. Y la portada de la home,
   `portada.webp` (mejor apaisada, 3:1).
3. **En `project.json`**, los campos (abajo).
4. **En `data/site.json`**, en `lists` → `home`, añade el nombre de la carpeta donde quieras que
   salga.
5. **Go Live** para verlo, y después **Subir los cambios**.

**Ocultarlo** sin borrarlo: `"visible": false` (su página sigue existiendo, para mandarla).
**Quitarlo**: bórralo de `lists` → `home`.

## Los campos de un proyecto (`project.json`)

| campo | qué hace |
|---|---|
| `title` | el título |
| `type`, `place`, `date` | la ficha: `"press"`, `"Barcelona"`, `"feb. 26"` |
| `text` | el texto de debajo del título |
| `team` | *opcional*: el equipo, `[{ "name": "Rivka", "role": "photo assist", "url": "https://…" }]` |
| `extras` | *opcional*: textos o audios entre las fotos. `{ "type": "text", "text": "…", "position": 2 }` (detrás de la foto 2; `0` es antes de la primera) o `{ "type": "audio", "file": "tema.opus", "position": 5 }` |
| `cover` | *opcional*: si la portada no es `portada.webp`, su formato: `"webm"` para un vídeo |
| `web` | *opcional*: un crédito con enlace, sin `https://` |
| `images` | *opcional*: enseñar solo las N primeras fotos. Sin él, todas |

Lo que no tenga un proyecto (fecha, equipo…), simplemente no se pone.

## La home

- **La cabecera**: `name`, `tagline`, `email` e `instagram` (sin @) en `data/site.json`.
- **El about**: es un proyecto más (`projects/_valentin/`), oculto; se abre al pulsar el nombre.
  `about` en `data/site.json` dice cuál es.
- **Los banners**: un vídeo (`.webm`) en `data/banners/` y, en `lists` → `home`, en el sitio
  donde quieras que salga, `{ "banner": "columna.webm" }`.

## Subir los cambios

Pestaña **Control de código fuente** → escribe qué has hecho → **Confirmar** → **Sincronizar**. En
un par de minutos está en la web. Antes de empezar a tocar, **Sincronizar** también.

## Si no se publica

La web no se rompe: se queda como estaba hasta que se arregla. El mensaje dice el fichero y qué
pasa (en la vista previa sale en pantalla):

- **"no es un JSON válido, línea 12"** → casi siempre **una coma** de más o de menos, o unas
  comillas sin cerrar.
- **"\"nombre\" no es un campo de aquí (¿mal escrito?). Los que hay: title, …"** → un campo mal
  escrito: cópialo de la lista del mensaje.
- **"falta projects/nuevo/3.webp (las fotos van seguidas…)"** → un hueco en la numeración.
- **"falta projects/nuevo/portada.webp"** → la portada no está o se llama de otra forma.
- **"\"lists\" dice \"nuevo\", y no hay ningún projects/nuevo/project.json"** → el nombre de la
  lista y el de la carpeta no son iguales.
