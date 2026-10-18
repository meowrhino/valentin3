# Traspaso: la versión nueva a la copia de Valentín

Valentín tiene su copia, `valentinbarriof-star/web`, que publica
`valentinbarrio.com` con Cloudflare (Workers, sin build: sirve los ficheros de
`main` tal cual, menos `.assetsignore`), y la edita él (CUPRA, en julio).
Podemos escribir en su repo. Es la versión de antes: un `data.json` y
`_PROJECTS/`; todas las direcciones sirven la misma página vacía (el 404).

**Su contenido y el nuestro eran iguales** el 2026-10-18 (`665d587`). Lo que
haya cambiado desde entonces hay que traerlo antes.

En su copia la Action de publicar no corre (lleva `if: github.repository_owner
== 'meowrhino'`) y Cloudflare construye con `wrangler.jsonc` (`node
build/build.mjs`, sale `dist/`).

Tiempo: unos 20 minutos. Para él cambia: `data.json` pasa a `data/site.json`
(la cabecera y el orden de la home) y a un `project.json` en cada carpeta de
`projects/` (antes `_PROJECTS/`), con los campos en inglés (`title`, `type`,
`place`, `date`, `text`, `team`, `extras`, `cover`). Las fotos, igual.

## Antes

- [ ] `main` de meowrhino al día y sin cambios a medias (`git status` limpio).
- [ ] ¿Ha tocado algo Valentín desde `665d587`?
      `gh api repos/valentinbarriof-star/web/commits --jq '.[0:3][] | .sha[0:7]+" "+.commit.message'`.
      Si sí, pasar sus cambios aquí antes (una entrada de `data.json` → `projects/<slug>/project.json`
      y su carpeta de `_PROJECTS/` → `projects/`).

## 1. La versión nueva, en una rama de su copia

- [ ] `git push https://github.com/valentinbarriof-star/web.git main:receta`
- [ ] En Cloudflare, en su Worker: rama `receta`, que construya con `wrangler.jsonc`. Mirar el
      `*.workers.dev`: la home, `/bolder/`, el about (pulsar el nombre) y el lightbox.

## 2. `main` pasa a ser la versión nueva

- [ ] Guardar la de antes: `git push https://github.com/valentinbarriof-star/web.git <sha-de-su-main>:refs/heads/antes`.
- [ ] `git push --force-with-lease=main:<sha-de-su-main> https://github.com/valentinbarriof-star/web.git main`
- [ ] En Cloudflare, rama de producción → **`main`**. Borrar la rama `receta`.

## 3. Comprobar en su dominio

- [ ] La home, un proyecto (`/soundit/`: las 71 fotos, sin peticiones HEAD en la pestaña Red),
      el about.
- [ ] `view-source:` de un proyecto: su título y su texto en el HTML; `canonical` con su dominio
      y **sin** `noindex`.
- [ ] `/robots.txt` dice `Allow` y `/sitemap.xml`.
- [ ] Compartir un proyecto por WhatsApp: sale su foto (la og).

## 4. Search Console, con su cuenta de Google

- [ ] Dar de alta el dominio y enviar `sitemap.xml`.

## 5. Al acabar

- [ ] Fila de valentinbarrio.com en `JAMstack/inventario.md` con las dos direcciones.
