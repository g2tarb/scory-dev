import './style.css';
import { initCursor } from './cursor.js';
import { initBooking } from './booking.js';
import { initSmooth } from './smooth.js';
import { slotText } from './slot.js';
import { initScrollBrand } from './brand-slot.js';

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

/* ---------- Boutons magnétiques (discret) ---------- */
if (!reduced && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.btn, .topcta').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
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
  items.forEach((item) => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
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
