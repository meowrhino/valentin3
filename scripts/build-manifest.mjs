// ============================================================================
// build-manifest.mjs — genera manifest.json escaneando _PROJECTS/
// ----------------------------------------------------------------------------
// Recorre cada carpeta de `_PROJECTS/<slug>/`, lista sus imágenes numeradas
// (`1.webp`, `2.webp`, …) en orden numérico —tolerando huecos en la
// numeración— e intenta leer el ancho/alto de cada .webp de sus primeros
// bytes (contenedor RIFF: chunk VP8 / VP8L / VP8X). El resultado es un
// `manifest.json` en la raíz del repo que la web usa para pintar la galería
// sin necesidad de sondear con HEAD requests en cada visita.
//
// Sin dependencias externas: solo `node:fs` y `node:path`.
//
// El JSON de salida es DETERMINISTA (claves ordenadas alfabéticamente, listas
// ordenadas numéricamente) para que la GitHub Action no genere diffs espurios.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(ROOT, '_PROJECTS');
const OUT_FILE = path.join(ROOT, 'manifest.json');

// Extensiones que consideramos imagen de galería. `portada.*` se ignora aparte.
const IMAGE_EXTS = new Set(['.webp', '.jpg', '.jpeg', '.png', '.gif']);

/** ¿El nombre es una imagen numerada de galería (`N.ext`)? Devuelve el número
 *  o null si no encaja (portada.*, audios, ocultos como .DS_Store, etc.). */
function numberedImage(name) {
  const ext = path.extname(name).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) return null;
  const base = name.slice(0, name.length - ext.length);
  if (!/^\d+$/.test(base)) return null; // solo nombres puramente numéricos
  return Number(base);
}

/** Lee width/height de un .webp a partir de sus primeros bytes.
 *  Soporta los tres formatos del contenedor RIFF/WEBP: VP8 (lossy), VP8L
 *  (lossless) y VP8X (extended). Devuelve {width,height} o null si no se
 *  puede parsear (formato no reconocido, archivo corrupto, etc.). */
function readWebpDimensions(buf) {
  if (buf.length < 16) return null;
  // Cabecera RIFF: 'RIFF' .... 'WEBP'
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buf.toString('ascii', 8, 12) !== 'WEBP') return null;

  const fourcc = buf.toString('ascii', 12, 16);

  if (fourcc === 'VP8 ') {
    // Lossy. Frame tag (3 bytes) + start code 0x9d 0x01 0x2a, luego 16-bit w/h.
    if (buf.length < 30) return null;
    if (buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) return null;
    const width = buf.readUInt16LE(26) & 0x3fff;
    const height = buf.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }

  if (fourcc === 'VP8L') {
    // Lossless. Tras el signature byte 0x2f, 14 bits width-1 y 14 bits height-1.
    if (buf.length < 25) return null;
    if (buf[20] !== 0x2f) return null;
    const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }

  if (fourcc === 'VP8X') {
    // Extended. Canvas size: 24-bit width-1 y 24-bit height-1 (little-endian).
    if (buf.length < 30) return null;
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { width, height };
  }

  return null;
}

/** Intenta leer dimensiones de un archivo de imagen. Solo parseamos .webp;
 *  para otros formatos devolvemos null (la imagen se incluye sin dimensiones).
 *  Nunca lanza: ante cualquier error de lectura devuelve null. */
function readDimensions(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.webp') return null;
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(32);
    fs.readSync(fd, buf, 0, 32, 0);
    return readWebpDimensions(buf);
  } catch {
    return null;
  } finally {
    if (fd !== undefined) { try { fs.closeSync(fd); } catch {} }
  }
}

/** Escanea una carpeta de proyecto y devuelve su lista ordenada de imágenes. */
function scanProject(slug) {
  const dir = path.join(PROJECTS_DIR, slug);
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const images = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const n = numberedImage(entry.name);
    if (n === null) continue; // ignora portada.*, audios, no-imágenes
    images.push({ n, file: entry.name });
  }

  // Orden numérico (no lexicográfico: 10.webp va después de 9.webp).
  images.sort((a, b) => a.n - b.n);

  return images.map(({ file }) => {
    const dims = readDimensions(path.join(dir, file));
    // Si no hay dimensiones, incluimos el archivo igualmente (solo el nombre).
    return dims ? { file, width: dims.width, height: dims.height } : { file };
  });
}

/** Serializa un valor JSON con las claves de objeto ordenadas alfabéticamente,
 *  para salida determinista. */
function stableStringify(value) {
  return JSON.stringify(value, (key, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.keys(val).sort().reduce((acc, k) => {
        acc[k] = val[k];
        return acc;
      }, {});
    }
    return val;
  }, 2);
}

function main() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.error(`No existe la carpeta ${PROJECTS_DIR}`);
    process.exit(1);
  }

  const slugs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort(); // claves de proyecto ordenadas alfabéticamente

  const projects = {};
  for (const slug of slugs) {
    projects[slug] = scanProject(slug);
  }

  const manifest = { projects };
  fs.writeFileSync(OUT_FILE, stableStringify(manifest) + '\n', 'utf8');

  const total = Object.values(projects).reduce((s, arr) => s + arr.length, 0);
  console.log(`manifest.json generado: ${slugs.length} proyectos, ${total} imágenes.`);
}

main();
