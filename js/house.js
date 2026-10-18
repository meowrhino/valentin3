/* house.js — la forma de la casa (data/site.json y projects/<slug>/project.json)
   → la del data.json de antes, que es la que lee main.js. La usan js/carga.js
   y el build. No toca el disco.

   counts: cuántas fotos tiene cada proyecto, lo que cuenta el build (en la
   vista previa no hay: main.js las busca, como antes). */

export const slugsOf = (site) => site.lists.home.filter((e) => typeof e === 'string');

export function projectOld(slug, p, count) {
  const out = {
    slug,
    nombre: p.title,
    visible: p.visible !== false,
    tipo: p.type ?? '',
    lugar: p.place ?? '',
  };
  if (p.cover) out.extension_portada = p.cover;
  if (p.date) out.fecha = p.date;
  if (p.text) out.descripcion = p.text;
  if (p.web) out.web = p.web;
  if (p.team) out.equipo = p.team.map((e) => ({ nombre: e.name, rol: e.role, url: e.url }));
  if (p.extras) out.extras = p.extras.map((e) => ({ tipo: e.type === 'text' ? 'texto' : e.type, texto: e.text, src: e.file, posicion: e.position ?? 0 }));
  const n = p.images ?? count;
  if (n) out.imagenes = n;
  return out;
}

export function toOld(site, projects, counts = {}) {
  return {
    meta: { nombre: site.name, about_slug: site.about, tagline: site.tagline, email: site.email, instagram: site.instagram },
    projects: site.lists.home.map((e) => (typeof e === 'string' ? projectOld(e, projects[e], counts[e]) : { banner: e.banner })),
  };
}
