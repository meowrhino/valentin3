# Banners

Aquí van los banners decorativos que se intercalan en la home entre los
proyectos. Son **decorativos**: no se pueden clicar, no enlazan a nada, no
tienen hover ni overlay.

## Cómo añadir un banner

1. Mete el archivo (vídeo o imagen) en esta carpeta.
2. En `data.json`, dentro del array `projects`, añade un objeto con la clave
   `banner` apuntando al nombre del archivo:
   ```json
   { "banner": "loop1.webm" }
   { "banner": "foto.webp" }
   ```
   El banner aparece en la home **en la posición que ocupe en el array**
   (entre el proyecto anterior y el siguiente). En el scroll infinito se
   mezcla al azar junto con el resto de proyectos.

## Formatos aceptados

La extensión del archivo decide cómo se renderiza:

- **Vídeo** (`.webm`, `.mp4`, `.mov`): se monta un `<video>` autoplay, muteado,
  en bucle. Recomendado para loops cortos (~5 seg).
- **Imagen** (`.webp`, `.jpg`, `.jpeg`, `.png`, `.gif`): se monta un `<img>`
  con `loading="lazy"`. Útil para fotos sueltas o gifs.

## Recomendaciones

- **Aspect ratio:** 3:1 (mismo que los strips de proyecto, ej. 2000×667).
- **Peso:** intentar < 1 MB para no penalizar la carga de la home.
- **Vídeo:** preferible `webm` por peso pequeño y soporte nativo.
- **Imagen:** preferible `webp` por la misma razón.
