// ============================================================================
// valentin3 — SPA router + iris (2 fases) + lightbox + scroll infinito
// ============================================================================

// ---------- Base path ----------
const SCRIPT_URL = new URL(import.meta.url);
const BASE_URL = new URL('../', SCRIPT_URL);
const BASE_PATH = BASE_URL.pathname;

function asset(p) {
  return BASE_PATH + String(p).replace(/^\.?\/+/, '');
}
function projectsAsset(slug, file) {
  return asset(`_PROJECTS/${slug}/${file}`);
}
function projectImgUrl(slug, n) {
  return projectsAsset(slug, `${n}.webp`);
}
function slugFromPath() {
  let p = window.location.pathname;
  if (p.startsWith(BASE_PATH)) p = p.slice(BASE_PATH.length);
  p = p.replace(/^\/+|\/+$/g, '');
  return p ? decodeURIComponent(p) : null;
}
function urlForSlug(slug) {
  return slug ? BASE_PATH + encodeURIComponent(slug) : BASE_PATH;
}

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Utilidades ----------
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateValue(from, to, duration, easing, apply) {
  return new Promise((resolve) => {
    const start = performance.now();
    function frame(now) {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / duration);
      apply(from + (to - from) * easing(p));
      if (p < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- Data ----------
let DATA = null;

async function loadData() {
  if (DATA) return DATA;
  const res = await fetch(asset('data.json'));
  if (!res.ok) throw new Error(`data.json ${res.status}`);
  DATA = await res.json();
  return DATA;
}

function findProject(data, slug) {
  if (!slug) return null;
  if (data.about && data.about.slug === slug) return data.about;
  return (data.projects || []).find((p) => p.slug === slug) || null;
}

function heroImgNumber(p) {
  return typeof p.imgHome === 'number' ? p.imgHome : 1;
}

// ============================================================================
// IRIS — dos fases "abriéndose":
//   Fase 1 (cover)  : círculo negro crece desde A hasta cubrir todo
//   Fase 2 (reveal) : agujero transparente crece desde B hasta descubrir todo
// ============================================================================
const Iris = (() => {
  let el = null;
  let busy = false;

  const COVER_MS = 550;
  const PAUSE_MS = 90;
  const REVEAL_MS = 650;

  function ensure() {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'iris';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    setMask(0, 0, 0, true); // estado inicial: totalmente transparente
    return el;
  }

  function setBusy(v) {
    busy = v;
    if (el) el.style.pointerEvents = v ? 'auto' : 'none';
  }

  function maxRadius(x, y) {
    const W = innerWidth, H = innerHeight;
    return Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 40;
  }

  // phase: 'cover' (black-inside) | 'reveal' (transparent-inside)
  function setMask(x, y, r, covering) {
    if (!el) return;
    const inner = covering ? '#000' : 'transparent';
    const outer = covering ? 'transparent' : '#000';
    const grad =
      `radial-gradient(circle at ${x}px ${y}px, ${inner} ${r}px, ${outer} ${r + 1}px)`;
    el.style.webkitMaskImage = grad;
    el.style.maskImage = grad;
  }

  function cover(x, y, duration = COVER_MS) {
    ensure();
    if (REDUCED_MOTION) { setMask(x, y, 99999, true); return Promise.resolve(); }
    const maxR = maxRadius(x, y);
    return animateValue(0, maxR, duration, easeInOutCubic, (r) => {
      setMask(x, y, r, true);
    });
  }

  function reveal(x, y, duration = REVEAL_MS) {
    ensure();
    if (REDUCED_MOTION) { setMask(x, y, 99999, false); return Promise.resolve(); }
    const maxR = maxRadius(x, y);
    return animateValue(0, maxR, duration, easeInOutCubic, (r) => {
      setMask(x, y, r, false);
    });
  }

  function pause() { return delay(PAUSE_MS); }

  return { cover, reveal, pause, setBusy, isBusy: () => busy };
})();

// ============================================================================
// LIGHTBOX
// ============================================================================
const Lightbox = (() => {
  let el = null, imgEl = null;
  let images = [];
  let idx = 0;
  let isOpen = false;
  let sourceRect = null;

  function ensure() {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'lightbox lightbox--hidden';
    el.innerHTML = `
      <img class="lightbox__img" alt="" />
      <button class="lightbox__close lightbox__close--tl" aria-label="close">×</button>
      <button class="lightbox__close lightbox__close--tr" aria-label="close">×</button>
      <button class="lightbox__close lightbox__close--bl" aria-label="close">×</button>
      <button class="lightbox__close lightbox__close--br" aria-label="close">×</button>
    `;
    document.body.appendChild(el);
    imgEl = el.querySelector('.lightbox__img');
    bind();
    return el;
  }

  function bind() {
    el.addEventListener('click', (e) => {
      if (e.target === el || e.target === imgEl) close();
    });
    el.querySelectorAll('.lightbox__close').forEach((b) => {
      b.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    });
    document.addEventListener('keydown', (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    });
  }

  function open(srcs, startIdx, fromEl) {
    ensure();
    images = srcs;
    idx = startIdx || 0;
    isOpen = true;
    sourceRect = fromEl ? fromEl.getBoundingClientRect() : null;

    imgEl.src = images[idx];

    if (sourceRect) {
      Object.assign(imgEl.style, {
        transition: 'none',
        position: 'fixed',
        left: sourceRect.left + 'px',
        top: sourceRect.top + 'px',
        width: sourceRect.width + 'px',
        height: sourceRect.height + 'px',
        maxWidth: 'none',
        maxHeight: 'none',
        objectFit: 'cover',
      });

      el.classList.remove('lightbox--hidden');
      el.style.background = 'transparent';
      void imgEl.offsetHeight;

      imgEl.style.transition = 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)';
      imgEl.style.left = '10dvw';
      imgEl.style.top = '10dvh';
      imgEl.style.width = '80dvw';
      imgEl.style.height = '80dvh';
      imgEl.style.objectFit = 'contain';

      setTimeout(() => {
        el.style.transition = 'background 0.25s ease';
        el.style.background = '';
      }, 40);

      setTimeout(() => {
        Object.assign(imgEl.style, {
          transition: '', position: '', left: '', top: '',
          width: '', height: '', maxWidth: '', maxHeight: '', objectFit: '',
        });
      }, 500);
    } else {
      el.classList.remove('lightbox--hidden');
    }
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    if (sourceRect) {
      const cur = imgEl.getBoundingClientRect();
      Object.assign(imgEl.style, {
        transition: 'none',
        position: 'fixed',
        left: cur.left + 'px',
        top: cur.top + 'px',
        width: cur.width + 'px',
        height: cur.height + 'px',
        maxWidth: 'none',
        maxHeight: 'none',
        objectFit: 'contain',
      });
      void imgEl.offsetHeight;

      imgEl.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      imgEl.style.left = sourceRect.left + 'px';
      imgEl.style.top = sourceRect.top + 'px';
      imgEl.style.width = sourceRect.width + 'px';
      imgEl.style.height = sourceRect.height + 'px';
      imgEl.style.objectFit = 'cover';

      el.style.transition = 'background 0.25s ease';
      el.style.background = 'transparent';

      setTimeout(() => {
        el.classList.add('lightbox--hidden');
        Object.assign(imgEl.style, {
          transition: '', position: '', left: '', top: '',
          width: '', height: '', maxWidth: '', maxHeight: '', objectFit: '',
        });
        el.style.transition = '';
        el.style.background = '';
      }, 420);
    } else {
      el.classList.add('lightbox--hidden');
    }
  }

  function swap(newIdx) {
    if (!isOpen || images.length <= 1) return;
    idx = (newIdx + images.length) % images.length;
    imgEl.style.transition = 'opacity 0.15s ease';
    imgEl.style.opacity = '0';
    setTimeout(() => {
      imgEl.src = images[idx];
      const done = () => { imgEl.style.opacity = '1'; };
      imgEl.addEventListener('load', done, { once: true });
      setTimeout(done, 120);
    }, 150);
  }

  function prev() { swap(idx - 1); }
  function next() { swap(idx + 1); }

  return { open, close, isOpen: () => isOpen };
})();

// ============================================================================
// HOME — strips iniciales en orden + scroll infinito random
// ============================================================================

// Estado de infinito (se resetea al entrar en home)
const InfState = {
  pool: [],
  poolPtr: 0,
  stripsEl: null,
  abort: null,
};

function buildStrip(p) {
  const a = document.createElement('a');
  a.className = 'strip';
  a.href = urlForSlug(p.slug);
  a.dataset.slug = p.slug;
  a.setAttribute('aria-label', p.nombre || p.slug);

  const img = document.createElement('img');
  img.src = projectImgUrl(p.slug, heroImgNumber(p));
  img.alt = p.nombre || p.slug;
  img.loading = 'lazy';
  a.appendChild(img);

  const dot = document.createElement('span');
  dot.className = 'dot';
  a.appendChild(dot);

  a.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const dotEl = a.querySelector('.dot');
    const r = dotEl.getBoundingClientRect();
    navigateTo(p.slug, {
      originX: r.left + r.width / 2,
      originY: r.top + r.height / 2,
    });
  });

  return a;
}

function appendRandomBatch(n = 6) {
  if (!InfState.stripsEl || !InfState.pool.length) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    if (InfState.poolPtr >= InfState.pool.length) {
      InfState.pool = shuffle(InfState.pool);
      InfState.poolPtr = 0;
    }
    frag.appendChild(buildStrip(InfState.pool[InfState.poolPtr++]));
  }
  InfState.stripsEl.appendChild(frag);
}

function setupInfiniteScroll(projects, signal) {
  InfState.pool = shuffle([...projects, ...projects, ...projects]);
  InfState.poolPtr = 0;

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const doc = document.documentElement;
      const scrollBottom = window.scrollY + window.innerHeight;
      const total = doc.scrollHeight;
      if (total - scrollBottom < innerHeight * 0.8) {
        appendRandomBatch(6);
      }
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true, signal });

  // asegurar que haya al menos un par de pantallas
  const ensureFill = () => {
    let guard = 0;
    while (document.documentElement.scrollHeight < innerHeight * 1.6 && guard < 20) {
      appendRandomBatch(6);
      guard++;
    }
  };
  ensureFill();
  window.addEventListener('resize', ensureFill, { signal });
}

function renderHome(data) {
  document.title = data.meta?.nombre || 'valentin barrio';

  const main = document.createElement('main');
  main.className = 'page page-home';

  const header = document.createElement('header');
  header.className = 'home-header';
  header.innerHTML = `
    <div class="name">${data.meta?.nombre || ''}</div>
    ${data.meta?.tagline ? `<div class="tagline">${data.meta.tagline}</div>` : ''}
    ${data.meta?.email ? `<a class="email" href="mailto:${data.meta.email}">${data.meta.email}</a>` : ''}
  `;
  main.appendChild(header);

  const strips = document.createElement('div');
  strips.className = 'strips';

  const initialList = [];
  if (data.about) initialList.push(data.about);
  initialList.push(...(data.projects || []));
  initialList.forEach((p) => strips.appendChild(buildStrip(p)));

  main.appendChild(strips);
  mount(main);

  // preparar infinito (sólo con projects, no el about)
  InfState.stripsEl = strips;
  setupInfiniteScroll(data.projects || [], PageSignal());
}

// ============================================================================
// PROYECTO
// ============================================================================
function makeRow(k, v) {
  const li = document.createElement('li');
  const kEl = document.createElement('span');
  kEl.className = 'k';
  kEl.textContent = k;
  const vEl = document.createElement('span');
  vEl.className = 'v';
  vEl.textContent = v;
  li.append(kEl, vEl);
  return li;
}

function buildFicha(p) {
  const aside = document.createElement('aside');
  aside.className = 'ficha';
  const ul = document.createElement('ul');
  if (p.tipo) ul.appendChild(makeRow('type', p.tipo));
  if (p.lugar) ul.appendChild(makeRow('place', p.lugar));
  if (p.fecha) ul.appendChild(makeRow('date', p.fecha));
  if (Array.isArray(p.equipo)) {
    p.equipo.forEach(({ nombre, rol }) => {
      if (!nombre) return;
      ul.appendChild(makeRow(rol || 'team', nombre));
    });
  }
  aside.appendChild(ul);
  return aside;
}

function buildDescription(p) {
  if (!p.descripcion && !p.nombre) return null;
  const div = document.createElement('div');
  div.className = 'desc';
  const h2 = document.createElement('h2');
  h2.textContent = p.nombre || p.slug;
  div.appendChild(h2);
  if (p.descripcion) {
    const pEl = document.createElement('p');
    pEl.textContent = p.descripcion;
    div.appendChild(pEl);
  }
  return div;
}

function galleryImageUrls(p) {
  if (Array.isArray(p.contenido) && p.contenido.length) {
    return p.contenido
      .filter((it) => it.tipo === 'imagen')
      .map((it) => projectImgUrl(p.slug, it.src));
  }
  const n = p.imgCount || 0;
  const out = [];
  for (let i = 1; i <= n; i++) out.push(projectImgUrl(p.slug, i));
  return out;
}

let currentAudio = null;

function fmtTime(t) {
  if (!isFinite(t)) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, '0');
  return m + ':' + s;
}

function buildAudioBlock(slug, item) {
  const wrap = document.createElement('div');
  wrap.className = 'audio-block';

  const player = document.createElement('div');
  player.className = 'audio-player';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'audio-player__btn';
  btn.textContent = '▶ play';

  const time = document.createElement('span');
  time.className = 'audio-player__time';
  time.textContent = '0:00';

  const bar = document.createElement('div');
  bar.className = 'audio-player__bar';
  const fill = document.createElement('div');
  fill.className = 'audio-player__fill';
  bar.appendChild(fill);

  const audio = new Audio();
  audio.src = projectsAsset(slug, item.src);
  audio.preload = 'metadata';

  btn.addEventListener('click', () => {
    if (audio.paused) {
      if (currentAudio && currentAudio !== audio) currentAudio.pause();
      audio.play();
      currentAudio = audio;
      btn.textContent = '❚❚ pause';
    } else {
      audio.pause();
      btn.textContent = '▶ play';
    }
  });

  audio.addEventListener('timeupdate', () => {
    time.textContent = fmtTime(audio.currentTime);
    if (audio.duration) {
      fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
    }
  });
  audio.addEventListener('ended', () => {
    btn.textContent = '▶ play';
    fill.style.width = '0%';
  });
  bar.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const r = bar.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  });

  player.append(btn, bar, time);
  wrap.appendChild(player);
  return wrap;
}

function buildGallery(p) {
  const gallery = document.createElement('div');
  gallery.className = 'gallery';
  const allImageUrls = galleryImageUrls(p);
  let imgIdx = 0;

  const attachImgClick = (imgEl) => {
    const myIdx = imgIdx++;
    imgEl.addEventListener('click', () => {
      Lightbox.open(allImageUrls, myIdx, imgEl);
    });
  };

  if (Array.isArray(p.contenido) && p.contenido.length > 0) {
    p.contenido.forEach((item) => {
      if (item.tipo === 'imagen') {
        const img = document.createElement('img');
        img.src = projectImgUrl(p.slug, item.src);
        img.alt = `${p.nombre || p.slug} — ${item.src}`;
        img.loading = 'lazy';
        img.className = 'gallery__img';
        attachImgClick(img);
        gallery.appendChild(img);
      } else if (item.tipo === 'texto') {
        const t = document.createElement('blockquote');
        t.className = 'text-block';
        t.textContent = item.texto || item.contenido || '';
        gallery.appendChild(t);
      } else if (item.tipo === 'audio') {
        gallery.appendChild(buildAudioBlock(p.slug, item));
      }
    });
  } else if (p.imgCount) {
    for (let i = 1; i <= p.imgCount; i++) {
      const img = document.createElement('img');
      img.src = projectImgUrl(p.slug, i);
      img.alt = `${p.nombre || p.slug} — ${i}`;
      img.loading = 'lazy';
      img.className = 'gallery__img';
      attachImgClick(img);
      gallery.appendChild(img);
    }
  }

  return gallery;
}

function renderProject(data, slug) {
  const p = findProject(data, slug);
  if (!p) { renderNotFound(slug); return; }

  const title = p.nombre || p.slug;
  document.title = `${title} — ${data.meta?.nombre || ''}`.trim();

  const main = document.createElement('main');
  main.className = 'page page-project';

  const marginTop = document.createElement('div');
  marginTop.className = 'proj-margin proj-margin--top';
  marginTop.innerHTML = '<span class="dot"></span>';
  main.appendChild(marginTop);

  const body = document.createElement('section');
  body.className = 'proj-body';
  const desc = buildDescription(p);
  if (desc) body.appendChild(desc);
  body.appendChild(buildFicha(p));
  main.appendChild(body);

  main.appendChild(buildGallery(p));

  const marginBottom = document.createElement('div');
  marginBottom.className = 'proj-margin proj-margin--bottom';
  marginBottom.innerHTML = '<span class="dot"></span>';
  main.appendChild(marginBottom);

  const homeWrap = document.createElement('div');
  homeWrap.className = 'home-link-wrap';
  const homeLink = document.createElement('a');
  homeLink.className = 'home-link';
  homeLink.href = urlForSlug(null);
  homeLink.textContent = 'back to home';
  homeLink.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigateTo(null, { fromSlug: slug });
  });
  homeWrap.appendChild(homeLink);

  const isAbout = data.about && data.about.slug === slug;
  if (isAbout) {
    const extra = document.createElement('a');
    extra.className = 'extra-link';
    extra.href = 'https://meowrhino.studio';
    extra.target = '_blank';
    extra.rel = 'noopener noreferrer';
    extra.textContent = 'web: meowrhino.studio';
    homeWrap.appendChild(extra);
  }

  main.appendChild(homeWrap);

  mount(main);
}

function renderNotFound(slug) {
  const main = document.createElement('main');
  main.className = 'page page-notfound';
  main.innerHTML = `<p>no se encontró el proyecto <code>${slug || ''}</code></p>`;
  const link = document.createElement('a');
  link.className = 'home-link';
  link.href = urlForSlug(null);
  link.textContent = '← home';
  link.addEventListener('click', (e) => { e.preventDefault(); navigateTo(null); });
  main.appendChild(link);
  mount(main);
}

// ============================================================================
// Router + iris flow
// ============================================================================

let lastSlug = null;
let pageAbort = null;
function PageSignal() { return pageAbort ? pageAbort.signal : undefined; }

function removeCurrentPage() {
  document.querySelectorAll('main.page').forEach((m) => m.remove());
}

function mount(main) {
  removeCurrentPage();
  if (pageAbort) pageAbort.abort();
  pageAbort = new AbortController();
  const iris = document.querySelector('.iris');
  if (iris) document.body.insertBefore(main, iris);
  else document.body.appendChild(main);
  window.scrollTo(0, 0);
}

function render(slug) {
  if (!DATA) return;
  if (slug) renderProject(DATA, slug);
  else renderHome(DATA);
  lastSlug = slug || null;
}

function centerOfViewport() {
  return { x: innerWidth / 2, y: innerHeight / 2 };
}

function findStripDotCenter(slug) {
  const strip = document.querySelector(`.strip[data-slug="${CSS.escape(slug)}"]`);
  if (!strip) return centerOfViewport();
  const dot = strip.querySelector('.dot');
  const rectOf = () => (dot || strip).getBoundingClientRect();
  let r = rectOf();
  if (r.top < 0 || r.bottom > innerHeight) {
    strip.scrollIntoView({ block: 'center', behavior: 'instant' });
    r = rectOf();
  }
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

async function navigateTo(slug, opts = {}) {
  if (Iris.isBusy()) return;
  const targetURL = urlForSlug(slug);
  if (window.location.pathname === targetURL) return;

  const goingToProject = !!slug;
  const origin = (typeof opts.originX === 'number')
    ? { x: opts.originX, y: opts.originY }
    : centerOfViewport();

  Iris.setBusy(true);
  try {
    // Fase 1: iris cubre (círculo negro que se abre desde origen)
    await Iris.cover(origin.x, origin.y);

    // breve pausa en negro + swap de contenido
    history.pushState({ slug }, '', targetURL);
    render(slug);
    await Iris.pause();
    await new Promise((r) => requestAnimationFrame(r));

    // Fase 2: iris revela (agujero que se abre desde destino)
    const target = goingToProject
      ? centerOfViewport()
      : (() => {
          const anchor = opts.fromSlug || lastSlug;
          return anchor ? findStripDotCenter(anchor) : centerOfViewport();
        })();

    await Iris.reveal(target.x, target.y);
  } finally {
    Iris.setBusy(false);
  }
}

window.addEventListener('popstate', async () => {
  const slug = slugFromPath();
  if (slug === lastSlug) return;
  if (Iris.isBusy()) return;

  Iris.setBusy(true);
  try {
    const c = centerOfViewport();
    await Iris.cover(c.x, c.y);
    const prevSlug = lastSlug;
    render(slug);
    await Iris.pause();
    await new Promise((r) => requestAnimationFrame(r));

    const target = (!slug && prevSlug)
      ? findStripDotCenter(prevSlug)
      : centerOfViewport();
    await Iris.reveal(target.x, target.y);
  } finally {
    Iris.setBusy(false);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (Lightbox.isOpen()) return;
  if (slugFromPath()) {
    e.preventDefault();
    navigateTo(null, { fromSlug: lastSlug });
  }
});

// ============================================================================
// Init
// ============================================================================
(async () => {
  try {
    await loadData();
    render(slugFromPath());
  } catch (err) {
    console.error(err);
    const m = document.createElement('main');
    m.className = 'page';
    m.innerHTML = `<p style="padding:2rem 1.25rem">error: ${err.message}</p>`;
    document.body.appendChild(m);
  }
})();
