# valentin3

El portfolio de Valentín Barrio (fotografía): una home de tiras con scroll infinito, una página
por proyecto con su galería, transiciones de iris y lightbox. Hecho por
[meowrhino.studio](https://meowrhino.studio) con la receta del estudio
([meowrhino/JAMstack](https://github.com/meowrhino/JAMstack)), en su forma de **SPA con
pre-render**. Para Valentín: [GUIA.md](GUIA.md). Traspaso: [TRASPASO.md](TRASPASO.md). Si el
build falla: [CLAUDE.md](CLAUDE.md).

```
valentin3/
├── data/site.json      # cabecera, about, y la home de arriba abajo ("lists" → "home", con banners)
├── data/banners/       # los vídeos decorativos de la home
├── projects/<slug>/    # un proyecto: project.json + portada.webp + 1.webp, 2.webp… (+ audios)
├── schema/             # qué campos lleva cada JSON (VS Code, el build y la vista previa)
├── build/build.mjs     # → dist/: una página por proyecto con su texto dentro y sus meta
├── js/main.js          # la SPA: home, proyecto, iris, lightbox, URLs limpias con pushState
├── js/carga.js         # lee los JSON (y los revisa en la vista previa)
├── js/house.js         # la forma de la casa → la del data.json de antes
├── js/validar.js       # el JSON Schema sin dependencias (de JAMstack)
├── css/, fonts/        # estilos y fuentes propias (woff2)
└── _headers            # caché en Cloudflare
```

## Cómo funciona

- **El build** (`npm ci && node build/build.mjs`) escribe la home y `/<slug>/` por proyecto con su
  title, description, canonical, og:image (1200×630, **sharp**) y el texto dentro; el 404 es la
  home (main.js lleva a donde toque). Cuenta las fotos de cada proyecto (`data/counts.json` en
  `dist/`): la web ya no las busca a tientas con peticiones HEAD.
- **Vista previa**: Live Server sobre la carpeta (`/slug` directo no funciona en local: entra por
  la home). Sin `data-built`, `js/carga.js` revisa los JSON y enseña en pantalla lo que pararía el
  build; las fotos se siguen buscando como antes.
- **Publicar**: nuestra copia, con la Action en `meowrhino.github.io/valentin3/` sin indexar; la de
  Valentín (`valentinbarriof-star/web`), con Workers Builds (`wrangler.jsonc`) en su dominio.
