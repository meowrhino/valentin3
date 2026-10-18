/* ============================================================
   build.mjs — data/site.json + projects/ + index.html → dist/, la web tal
   cual se publica.        node build/build.mjs

   La web sigue siendo una sola aplicación (main.js: la home de tiras, el
   iris, el lightbox), pero cada proyecto tiene ahora su página de verdad,
   /<slug>/, con su title, description, canonical y og:image, y su texto
   escrito en el HTML (antes, la misma página vacía para todos, servida por
   el 404). Y el build cuenta las fotos de cada proyecto: la web ya no las
   busca a tientas.

   Si algo está mal (una coma, un campo mal escrito, una foto que no está)
   para y dice qué, y no se publica nada: la web se queda como estaba.
   ============================================================ */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugsOf } from '../js/house.js';
import { leerJSON, validar } from '../js/validar.js';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUT = join(ROOT, 'dist');
const at = (...p) => join(ROOT, ...p);
const fail = (msg) => { console.error(`\n✗ ${msg}\n\nNo se ha publicado nada: la web sigue como estaba.\n`); process.exit(1); };

/* ---------- leer y revisar ---------- */

const read = (rel) => {
  if (!existsSync(at(rel))) fail(`no encuentro ${rel}`);
  try { return leerJSON(readFileSync(at(rel), 'utf8'), rel); } catch (e) { fail(e.message); }
};
const schema = (t) => JSON.parse(readFileSync(at('schema', `${t}.json`), 'utf8'));
const site = read('data/site.json');
const errors = validar(site, schema('site'), 'data/site.json');
const projects = {};
const counts = {};
for (const slug of errors.length ? [] : slugsOf(site)) {
  const rel = `projects/${slug}/project.json`;
  if (projects[slug]) { errors.push(`data/site.json: "${slug}" está dos veces en "lists"`); continue; }
  if (!existsSync(at(rel))) { errors.push(`data/site.json: "lists" dice "${slug}", y no hay ningún ${rel}`); continue; }
  const p = projects[slug] = read(rel);
  const before = errors.length;
  errors.push(...validar(p, schema('project'), rel));
  if (errors.length > before) continue;
  const files = readdirSync(at('projects', slug));
  if (p.visible !== false && !files.includes(`portada.${p.cover || 'webp'}`)) errors.push(`${rel}: falta projects/${slug}/portada.${p.cover || 'webp'} (la portada de la home)`);
  // las fotos: 1.webp, 2.webp… seguidas
  const nums = files.map((f) => /^(\d+)\.webp$/.exec(f)?.[1]).filter(Boolean).map(Number);
  const max = Math.max(0, ...nums);
  for (let i = 1; i <= max; i++) if (!nums.includes(i)) errors.push(`${rel}: falta projects/${slug}/${i}.webp (las fotos van seguidas, de la 1 a la ${max})`);
  if (p.images && p.images > max) errors.push(`${rel}: "images" dice ${p.images}, y hay ${max}`);
  counts[slug] = max;
  for (const ex of p.extras || []) if (ex.file && !files.includes(ex.file)) errors.push(`${rel}: el extra dice "${ex.file}", y no está en projects/${slug}/`);
}
for (const e of errors.length ? [] : site.lists.home) if (typeof e !== 'string' && !existsSync(at('data/banners', e.banner))) errors.push(`data/site.json: no encuentro data/banners/${e.banner}`);
if (!errors.length && site.about && !projects[site.about]) errors.push(`data/site.json: "about" dice "${site.about}", y no está en "lists"`);
if (errors.length) fail(errors.join('\n✗ '));
for (const d of readdirSync(at('projects'))) {
  if (existsSync(at('projects', d, 'project.json')) && !projects[d]) console.warn(`⚠ projects/${d} no está en data/site.json → lists: no se publica`);
}

/* Dónde se publica, según dónde se construye (JAMstack, patrones §5): en la
   Action de GitHub (nuestra copia), meowrhino.github.io/<repo>/ y sin
   indexar; en cualquier otro sitio (Cloudflare, en la copia de Valentín),
   la raíz con el dominio de site.json → "url", y se indexa si lo hay. */
const github = process.env.GITHUB_ACTIONS === 'true';
const [owner, repo] = (process.env.GITHUB_REPOSITORY || '/').split('/');
const BASE = github ? `/${repo}` : '';
const SITE = github ? `https://${owner}.github.io${BASE}` : String(site.url || '').replace(/\/+$/, '');
const INDEX = !github && !!site.url;

/* ---------- la imagen al compartir, con sharp: la primera foto ---------- */

let sharp = null;
try { sharp = (await import('sharp')).default; } catch (e) {
  console.warn(`⚠ sin sharp (${e.code || e.message}): al compartir sale la foto tal cual. Se arregla con: npm ci`);
}
const slugs = Object.keys(projects);
const ogs = new Map();
for (const slug of sharp ? slugs.filter((s) => counts[s]) : []) {
  const src = at('projects', slug, '1.webp');
  const cached = at('.cache', 'og', `${slug}.jpg`);
  try {
    if (!(existsSync(cached) && statSync(cached).mtimeMs >= statSync(src).mtimeMs)) {
      mkdirSync(dirname(cached), { recursive: true });
      await sharp(src).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 85, mozjpeg: true }).toFile(cached);
    }
    ogs.set(slug, cached);
  } catch (e) {
    console.warn(`⚠ projects/${slug}/1.webp: sharp no la puede leer (${e.message})`);
  }
}
const ogUrl = (slug) => (ogs.has(slug) ? `${SITE}/og/${slug}.jpg` : counts[slug] ? `${SITE}/projects/${slug}/1.webp` : '');

/* ---------- las páginas ---------- */

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cut = (s) => (s.length <= 160 ? s : s.slice(0, 157).trimEnd() + '…');
function swap(html, find, replace) {
  if (!find.test(html)) fail(`no encuentro ${find} en index.html: el build lo necesita para escribir las páginas.`);
  return html.replace(find, replace);
}
const set = (html, re, v) => swap(html, re, (_, a, b) => `${a}${esc(v)}${b}`);
const TEMPLATE = readFileSync(at('index.html'), 'utf8');
const homeDesc = (/<meta name="description" content="([^"]*)"/.exec(TEMPLATE) || [])[1] || site.tagline;
const sr = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
const visible = slugs.filter((s) => projects[s].visible !== false);
const nav = visible.map((s) => `<a href="${encodeURIComponent(s)}/">${esc(projects[s].title)}</a>`).join(' ');

function page({ path, title, desc, image, robots, h1, body = '' }) {
  const url = `${SITE}/${path}`;
  let html = TEMPLATE.replaceAll('https://valentinbarrio.com', SITE);
  html = swap(html, /<html lang="en">/, '<html lang="en" data-built>');
  html = swap(html, /(<meta charset="UTF-8">)/, `$1\n<base href="${BASE}/">\n<meta name="robots" content="${robots || (INDEX ? 'index,follow' : 'noindex')}">`);
  html = swap(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  for (const [re, v] of [
    [/(<meta name="description" content=")[^"]*(")/, desc], [/(<meta property="og:description" content=")[^"]*(")/, desc],
    [/(<meta name="twitter:description" content=")[^"]*(")/, desc], [/(<meta property="og:title" content=")[^"]*(")/, title],
    [/(<meta name="twitter:title" content=")[^"]*(")/, title], [/(<link rel="canonical" href=")[^"]*(")/, url],
    [/(<meta property="og:url" content=")[^"]*(")/, url],
  ]) html = set(html, re, v);
  if (image) {
    html = set(html, /(<meta property="og:image" content=")[^"]*(")/, image);
    html = set(html, /(<meta name="twitter:image" content=")[^"]*(")/, image);
  }
  // lo que leen Google y los lectores de pantalla (la web la pinta main.js)
  return swap(html, /(<body>)/, `$1\n<div style="${sr}"><h1>${esc(h1)}</h1>${body}<nav><a href="./">${esc(site.name)}</a> ${nav}</nav></div>`);
}

const aboutImg = site.about ? ogUrl(site.about) : '';
const home = page({ path: '', title: `${site.name} — ${site.tagline}`, desc: homeDesc, image: aboutImg, h1: site.name, body: `<p>${esc(site.tagline)}</p>` });

/* ---------- escribir dist/ ---------- */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const f of ['css', 'js', 'fonts', 'data', 'projects', '_headers']) cpSync(at(f), join(OUT, f), { recursive: true, filter: (x) => !x.endsWith('.DS_Store') });
writeFileSync(join(OUT, 'data', 'counts.json'), JSON.stringify(counts));
mkdirSync(join(OUT, 'og'), { recursive: true });
for (const [slug, cached] of ogs) cpSync(cached, join(OUT, 'og', `${slug}.jpg`));
writeFileSync(join(OUT, 'index.html'), home);
// si alguien llega a una dirección que no existe, la web (main.js) le lleva a la home
writeFileSync(join(OUT, '404.html'), home.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex">'));
for (const slug of slugs) {
  const p = projects[slug];
  const meta = [p.type, p.place, p.date].filter(Boolean).join(' · ');
  mkdirSync(join(OUT, slug), { recursive: true });
  writeFileSync(join(OUT, slug, 'index.html'), page({
    path: `${encodeURIComponent(slug)}/`, title: `${p.title} — ${site.name}`,
    desc: cut(p.text || `${p.title} — ${site.name}`), image: ogUrl(slug), h1: p.title,
    robots: p.visible === false && slug !== site.about ? 'noindex' : null,
    body: `${meta ? `<p>${esc(meta)}</p>` : ''}${p.text ? `<p>${esc(p.text)}</p>` : ''}`,
  }));
}
const urls = [`${SITE}/`, ...[...visible, ...(site.about && !visible.includes(site.about) ? [site.about] : [])].map((s) => `${SITE}/${encodeURIComponent(s)}/`)];
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), INDEX ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
writeFileSync(join(OUT, '.nojekyll'), '');

console.log(`✓ dist/: la home y ${slugs.length} proyectos${INDEX ? ` · se indexa (${SITE})` : ' · sin indexar'}`);
