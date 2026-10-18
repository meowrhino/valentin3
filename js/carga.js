// carga.js — lee data/site.json y projects/<slug>/project.json y los pasa a la
// forma del data.json de antes (js/house.js).
//
// Las páginas que escribe el build llevan data-built en <html> (y el build deja
// en data/counts.json cuántas fotos tiene cada proyecto). Sin data-built es la
// vista previa (Live Server, sin build): cada JSON se revisa con su esquema
// (schema/) como hace el build, y lo que esté mal sale en pantalla.

import { slugsOf, toOld } from './house.js';
import { leerJSON, validar } from './validar.js';

export const BUILT = document.documentElement.hasAttribute('data-built');
const ROOT = new URL('../', import.meta.url).href; // la raíz de la web, esté donde esté

async function get(path) {
  const res = await fetch(ROOT + path, { cache: BUILT ? 'default' : 'no-store' });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  try { return leerJSON(await res.text(), path); } catch (e) { showErrors([e.message]); throw e; }
}

async function checked(path, type) {
  const data = await get(path);
  if (!BUILT) {
    const errors = validar(data, await get(`schema/${type}.json`), path);
    if (errors.length) { showErrors(errors); throw new Error(errors.join('\n')); }
  }
  return data;
}

export function showErrors(errors) {
  let box = document.getElementById('errores-vista-previa');
  if (!box) {
    box = document.createElement('pre');
    box.id = 'errores-vista-previa';
    box.style.cssText = 'position:fixed;inset:0;z-index:99999;margin:0;padding:2rem;overflow:auto;white-space:pre-wrap;'
      + 'background:#fff;color:#000;font:15px/1.5 monospace;';
    box.textContent = 'esto no se publicaría:\n\n';
    document.body.append(box);
  }
  box.textContent += errors.map((e) => `✗ ${e}`).join('\n') + '\n\narréglalo, guarda, y la página se recarga sola.\n';
}

export async function loadData() {
  const site = await checked('data/site.json', 'site');
  const projects = Object.fromEntries(await Promise.all(slugsOf(site).map(async (s) => [s, await checked(`projects/${s}/project.json`, 'project')])));
  const counts = BUILT ? await get('data/counts.json').catch(() => ({})) : {};
  return toOld(site, projects, counts);
}
