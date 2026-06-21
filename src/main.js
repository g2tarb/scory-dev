import './style.css';
import { initCursor } from './cursor.js';
import { initBooking } from './booking.js';
import { initSmooth } from './smooth.js';
import { slotText } from './slot.js';
import { initScrollBrand } from './brand-slot.js';
import { estimate, eur, MAX_SCALE } from './pricing.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initCursor();
const lenis = initSmooth();

/* ---------- Loader ---------- */
const loader = document.getElementById('loader');
window.requestAnimationFrame(() => loader && loader.classList.add('is-hidden'));

/* ---------- Apparition au scroll (étagée, fondu + flou) ---------- */
(function reveals() {
  // Délai progressif entre éléments d'un même groupe.
  const groups = new Map();
  document.querySelectorAll('.reveal').forEach((el) => {
    const p = el.parentElement;
    const arr = groups.get(p) || [];
    arr.push(el);
    groups.set(p, arr);
  });
  groups.forEach((arr) => arr.forEach((el, i) => { el.style.transitionDelay = `${Math.min(i, 6) * 70}ms`; }));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
})();

/* ---------- Marque .dev — roulette pilotée par la force du scroll ---------- */
(function brandSlot() {
  const dot = document.querySelector('.brand-dot');
  if (dot) initScrollBrand(dot);
})();

/* ---------- Mot rotatif du h1 — effet roulette ---------- */
(function rotator() {
  const el = document.querySelector('.rotator');
  if (!el) return;
  const words = (el.dataset.words || '').split(',').filter(Boolean);
  if (!words.length) return;
  let i = 0;
  window.setInterval(() => {
    if (document.body.classList.contains('site-error')) return; // gelé pendant le bug
    i = (i + 1) % words.length;
    slotText(el, words[i]);
  }, 3400);
})();

/* ---------- Corruption des titres en « error » pendant le bug ---------- */
(function titleCorruption() {
  const SELECTOR = '.rotator, #vitrine .h2, .work-name, .step-t';
  let saved = [];
  window.addEventListener('scory:error', () => {
    saved = [...document.querySelectorAll(SELECTOR)].map((el) => {
      const orig = el.textContent;
      el.textContent = 'error';
      el.classList.add('text-error');
      return { el, orig };
    });
  });
  window.addEventListener('scory:error-end', () => {
    saved.forEach(({ el, orig }) => { el.textContent = orig; el.classList.remove('text-error'); });
    saved = [];
  });
})();

/* ---------- Topbar réactive au scroll ---------- */
(function topbar() {
  const bar = document.querySelector('[data-topbar]');
  if (!bar) return;
  const onScroll = () => bar.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---------- Barre d'onglets mobile : onglet actif = section visible ---------- */
(function tabbar() {
  const tabs = [...document.querySelectorAll('.tab[data-sec]')];
  if (!tabs.length) return;
  // Liens de la nav desktop pointant vers une section (#xxx) → surlignage synchronisé.
  const navLinks = [...document.querySelectorAll('.topnav a[href^="#"]')];
  const sections = tabs
    .map((t) => document.getElementById(t.dataset.sec))
    .filter(Boolean);
  const setActive = (id) => {
    tabs.forEach((t) => {
      const on = t.dataset.sec === id;
      t.classList.toggle('is-active', on);
      if (on) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
    });
    navLinks.forEach((a) => {
      if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        setActive(e.target.id);
      });
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }, // section au centre du viewport = active
  );
  sections.forEach((s) => io.observe(s));
})();

/* ---------- Boutons magnétiques (discret) ---------- */
if (!reduced && window.matchMedia('(hover: hover)').matches) {
  const clamp = (v, m) => Math.max(-m, Math.min(m, v));
  document.querySelectorAll('.btn, .topcta').forEach((btn) => {
    let raf = 0;
    btn.addEventListener('mousemove', (e) => {
      if (raf) return; // throttle : un seul calcul par frame
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const r = btn.getBoundingClientRect();
        const x = clamp((e.clientX - r.left - r.width / 2) * 0.25, 12);
        const y = clamp((e.clientY - r.top - r.height / 2) * 0.35, 12);
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
    });
    btn.addEventListener('mouseleave', () => {
      if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
      btn.style.transform = '';
    });
  });
}

/* ---------- Aperçu projet au survol (réalisations) ---------- */
(function workPreview() {
  const preview = document.querySelector('.work-preview');
  if (!preview || !window.matchMedia('(hover: hover)').matches) return;
  const pImg = preview.querySelector('img');
  document.querySelectorAll('.work-row[data-img]').forEach((row) => {
    row.addEventListener('mouseenter', () => {
      pImg.src = row.dataset.img;
      preview.classList.add('is-on');
    });
    row.addEventListener('mousemove', (e) => {
      preview.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 80}px)`;
    });
    row.addEventListener('mouseleave', () => preview.classList.remove('is-on'));
  });
})();

/* ---------- FAQ — domino révélé au scroll (chaque question quand on l'atteint) ---------- */
(function faqReveal() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;
  if (reduced) { items.forEach((i) => i.classList.add('in')); return; }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }),
    { threshold: 0, rootMargin: '0px 0px -22% 0px' }, // se déclenche quand la question monte dans le viewport
  );
  items.forEach((i) => io.observe(i));
})();

/* ---------- FAQ — accordéon (single-open, accessible) ---------- */
(function faq() {
  const items = [...document.querySelectorAll('.faq-item')];
  items.forEach((item, i) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q) return;
    // Liaison ARIA question ↔ réponse (lecteurs d'écran).
    if (a) {
      const qid = `faq-q-${i}`;
      const aid = `faq-a-${i}`;
      q.id = qid;
      a.id = aid;
      q.setAttribute('aria-controls', aid);
      a.setAttribute('role', 'region');
      a.setAttribute('aria-labelledby', qid);
    }
    q.addEventListener('click', () => {
      const willOpen = !item.classList.contains('open');
      items.forEach((o) => {
        const isThis = o === item && willOpen;
        o.classList.toggle('open', isThis);
        o.querySelector('.faq-q')?.setAttribute('aria-expanded', isThis ? 'true' : 'false');
      });
    });
  });
})();

/* ---------- Prise de RDV maison ---------- */
const booking = initBooking();
document.querySelectorAll('.js-rdv').forEach((b) => b.addEventListener('click', () => booking.open()));

/* ---------- Assembleur de site → maquette générée à l'instant ---------- */
(function builder() {
  const root = document.querySelector('.builder');
  if (!root) return;
  const sel = (group) =>
    [...root.querySelectorAll(`.chips[data-group="${group}"] .chip.is-on`)].map((c) => c.textContent.trim());

  const result = root.querySelector('.builder-result');
  const recap = root.querySelector('.builder-result__recap');
  const mock = root.querySelector('[data-mock]');
  let shown = false;
  let raf = 0;

  /* ----- Estimation de prix live (fourchette basse → haute) ----- */
  const lowEl = root.querySelector('.estim-low');
  const highEl = root.querySelector('.estim-high');
  const band = root.querySelector('.estim-band');
  const shown2 = { low: 0, high: 0 }; // valeurs actuellement affichées (pour le tween)

  const tween = (el, key, to) => {
    const from = shown2[key];
    if (from === to) { el.textContent = eur(to); return; }
    const dur = 450;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
      el.textContent = eur(from + (to - from) * e);
      if (k < 1) window.requestAnimationFrame(step);
      else shown2[key] = to;
    };
    window.requestAnimationFrame(step);
  };

  const updateEstimate = () => {
    const [lo, hi] = estimate([...sel('base'), ...sel('options')]);
    tween(lowEl, 'low', lo);
    tween(highEl, 'high', hi);
    if (band) {
      band.style.left = `${Math.min(100, (lo / MAX_SCALE) * 100)}%`;
      band.style.right = `${Math.max(0, 100 - (hi / MAX_SCALE) * 100)}%`;
    }
  };

  const generate = (scroll) => {
    const blocs = sel('base');
    const options = sel('options');
    const all = [...blocs, ...options];
    recap.textContent =
      `${blocs.length} bloc${blocs.length > 1 ? 's' : ''} · ${options.length} option${options.length > 1 ? 's' : ''}` +
      (all.length ? ` — ${all.join(' · ')}` : ' — rien de sélectionné');
    import('./mockup.js').then(({ renderMockup }) => renderMockup(mock, { blocs, options }));
    result.hidden = false;
    shown = true;
    if (scroll) result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Toggle d'un bloc/option → prix recalculé + maquette régénérée si affichée.
  root.querySelectorAll('.chip').forEach((c) =>
    c.addEventListener('click', () => {
      c.classList.toggle('is-on');
      updateEstimate();
      if (!shown) return;
      if (raf) window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => generate(false));
    }),
  );

  root.querySelector('.builder-go')?.addEventListener('click', () => generate(true));

  // Le RDV emporte la config choisie + la fourchette estimée.
  root.querySelector('.js-rdv-builder')?.addEventListener('click', () => {
    const [lo, hi] = estimate([...sel('base'), ...sel('options')]);
    booking.open({ blocs: sel('base'), options: sel('options') }, `${eur(lo)} – ${eur(hi)}`);
  });

  updateEstimate(); // valeur initiale au chargement
})();

/* ---------- Portail → /univers (vrai portfolio immersif) ---------- */
(function portal() {
  const fx = document.querySelector('.portal-fx');
  const go = (e) => {
    if (e) e.preventDefault();
    if (reduced || !fx) { window.location.href = '/univers/index.html'; return; }
    fx.classList.add('expand');
    window.setTimeout(() => fx.classList.add('loading'), 480); // loader une fois l'écran couvert
    window.setTimeout(() => { window.location.href = '/univers/index.html'; }, 2000); // mini-chargement masquant
  };
  document.querySelectorAll('.js-portal').forEach((a) => a.addEventListener('click', go));
})();

/* ---------- Constellation du Capricorne (droite du hero) ---------- */
(function heroFx() {
  const canvas = document.getElementById('heroFx');
  if (!canvas) return;
  import('./constellation.js').then(({ initConstellation }) => initConstellation(canvas)).catch(() => {});
})();

/* ---------- Fond de constellations révélé au scroll (dès la 2e section) ---------- */
(function bgFx() {
  const canvas = document.getElementById('bgFx');
  if (!canvas) return;
  import('./bg-constellations.js').then(({ initBgConstellations }) => initBgConstellations(canvas)).catch(() => {});
})();
