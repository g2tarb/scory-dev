/* Page de brief projet — wizard plein écran.
   La sphère IA binaire (la même que l'univers) accompagne et conseille via sa bulle.
   Envoie le brief au backend (POST /api/brief). */

import { initFxLayer } from '../univers/fx-layer.js';

const TOTAL = 6;
const TYPES = [
  { v: 'Site vitrine', i: '🖥️' }, { v: 'E-commerce', i: '🛒' }, { v: 'Web app / SaaS', i: '⚙️' },
  { v: 'Application mobile', i: '📱' }, { v: 'Refonte', i: '🔁' }, { v: 'Autre', i: '✨' },
];
const GOALS = [
  { v: 'Vendre en ligne', i: '💸' }, { v: 'Générer des leads', i: '🎯' }, { v: 'Image de marque', i: '👑' },
  { v: 'Recruter', i: '🤝' }, { v: 'Me lancer', i: '🚀' }, { v: 'Autre', i: '✨' },
];
const FEATURES = ['Prise de RDV', 'Paiement en ligne', 'Espace membre', 'Blog', 'Multilingue', 'Agent IA', 'Animations 3D', 'SEO avancé', 'Tableau de bord', 'Notifications'];
const BUDGETS = ['Moins de 2 000 €', '2 à 5 000 €', '5 à 10 000 €', 'Plus de 10 000 €', 'À définir'];
const TIMELINES = ['Au plus vite', 'Sous 1 mois', '2 à 3 mois', 'Pas pressé'];
const STYLES = ['Épuré', 'Premium', 'Coloré', 'Sombre', 'Joueur', 'Corporate', 'Minimal', 'Audacieux'];

// Conseils de l'IA binaire pour chaque étape (le pourquoi + le comment).
const ADVICE = [
  "On commence simple. Le type cadre tout le reste : une vitrine pour présenter, une web app si tes clients ont un compte. Hésites ? Prends « Autre », on tranche ensemble.",
  "L'objectif oriente chaque choix de design. Vendre, rassurer ou recruter, ce n'est pas le même site. Donne-moi le vrai but numéro un.",
  "Coche large : chaque fonction joue sur le devis et le délai. Mieux vaut tout poser maintenant, on élaguera ensuite.",
  "Une fourchette honnête m'aide à caler le bon périmètre, sans gonfler ni rogner. Pas d'idée de budget ? « À définir », c'est très bien.",
  "Le style, c'est l'émotion. Deux ou trois mots-clés et un site que tu aimes en disent plus que dix paragraphes.",
  "Dernière ligne droite. Promis, zéro spam : juste de quoi te recontacter sous 24 h avec une vraie réponse, pas un copier-coller.",
];
const ADVICE_PREFILL = "J'ai repris ta composition de l'assembleur : le type et les fonctions sont déjà cochés. Vérifie, ajuste, et complète le reste avec moi.";
const ADVICE_DONE = "Reçu cinq sur cinq. Je transmets ton brief à Scory, il revient vers toi très vite. Beau projet !";

const FEATURE_MAP = {
  'Prise de RDV': 'Prise de RDV', 'Paiement en ligne': 'Paiement en ligne', 'Paiement in-app': 'Paiement en ligne',
  'Espace membre': 'Espace membre', Authentification: 'Espace membre', Multilingue: 'Multilingue',
  'Agent IA': 'Agent IA', 'Animations 3D': 'Animations 3D', 'SEO avancé': 'SEO avancé', 'Notifications push': 'Notifications',
};
const eur = (n) => `${Math.round(n).toLocaleString('fr-FR')} €`;
const budgetBucket = (lo, hi) => {
  const mid = (lo + hi) / 2;
  if (mid < 2000) return 'Moins de 2 000 €';
  if (mid < 5000) return '2 à 5 000 €';
  if (mid < 10000) return '5 à 10 000 €';
  return 'Plus de 10 000 €';
};

const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Sphère IA binaire identique à l'univers, pilotée à la main.
const fx = initFxLayer({ manual: true });
const advise = (txt) => { try { fx && fx.say && fx.say(txt); } catch (_e) {} };

const state = { projectType: '', goal: '', features: [], budget: '', timeline: '', style: [], refs: '', name: '', email: '', company: '', message: '' };
let step = 1;
let sent = false;
let prefilled = false;

/* ---------- Pré-remplissage depuis l'assembleur (via sessionStorage) ---------- */
try {
  const raw = sessionStorage.getItem('scory:brief');
  if (raw) {
    const p = JSON.parse(raw);
    sessionStorage.removeItem('scory:brief');
    prefilled = true;
    state.projectType = p.kind === 'app' ? 'Application mobile' : 'Site vitrine';
    state.features = [...new Set((p.options || []).map((o) => FEATURE_MAP[o]).filter(Boolean))];
    if (typeof p.low === 'number' && typeof p.high === 'number') state.budget = budgetBucket(p.low, p.high);
    const parts = [];
    if (p.blocs && p.blocs.length) parts.push(`${p.kind === 'app' ? 'Écrans' : 'Blocs'} : ${p.blocs.join(', ')}`);
    if (p.options && p.options.length) parts.push(`Options : ${p.options.join(', ')}`);
    if (typeof p.low === 'number') parts.push(`Estimation indicative : ${eur(p.low)} à ${eur(p.high)}`);
    state.message = `Composé via l'assembleur. ${parts.join(' · ')}`;
  }
} catch (_e) { /* prefill optionnel */ }

/* ---------- DOM ---------- */
const app = document.getElementById('brief-app');
app.innerHTML = `
  <div class="brief-head">
    <div class="brief-dots" aria-hidden="true"></div>
    <span class="brief-stepnum"></span>
  </div>
  <div class="brief-stage" aria-live="polite"></div>
  <div class="brief-nav">
    <button class="brief-back bf-link" type="button">← Retour</button>
    <button class="brief-next bf-glow" type="button"></button>
  </div>`;
const stage = app.querySelector('.brief-stage');
const dots = app.querySelector('.brief-dots');
const stepnum = app.querySelector('.brief-stepnum');
const backBtn = app.querySelector('.brief-back');
const nextBtn = app.querySelector('.brief-next');
const nav = app.querySelector('.brief-nav');
for (let i = 0; i < TOTAL; i++) dots.appendChild(el('span', 'brief-dot'));

/* ---------- Rendu ---------- */
function choiceGrid(items, isMulti, getActive, onPick) {
  const grid = el('div', 'brief-grid');
  items.forEach((it) => {
    const v = typeof it === 'string' ? it : it.v;
    const icon = typeof it === 'string' ? null : it.i;
    const b = el('button', 'brief-choice'); b.type = 'button';
    if (icon) b.appendChild(el('span', 'brief-choice__i', icon));
    b.appendChild(el('span', 'brief-choice__l', v));
    const sync = () => b.classList.toggle('is-on', getActive(v));
    sync();
    b.addEventListener('click', () => { onPick(v); if (isMulti) sync(); });
    grid.appendChild(b);
  });
  return grid;
}
function field(label, key, type, ph) {
  const w = el('label', 'brief-field');
  w.appendChild(el('span', 'brief-label', label));
  const input = el('input', 'brief-input');
  input.type = type; input.placeholder = ph; input.value = state[key];
  input.autocomplete = key === 'email' ? 'email' : key === 'name' ? 'name' : 'organization';
  input.addEventListener('input', () => { state[key] = input.value; syncChrome(); });
  w.appendChild(input);
  return w;
}
const toggle = (arr, v) => { const i = arr.indexOf(v); if (i === -1) arr.push(v); else arr.splice(i, 1); };
function markSingle() {
  stage.querySelectorAll('.brief-grid').forEach((g, gi) => {
    const set = step === 4 ? (gi === 0 ? state.budget : state.timeline) : null;
    if (set == null) return;
    g.querySelectorAll('.brief-choice').forEach((b) => b.classList.toggle('is-on', b.querySelector('.brief-choice__l').textContent === set));
  });
}

function render() {
  stage.innerHTML = '';
  const wrap = el('div', 'brief-step');
  if (step === 1) {
    wrap.appendChild(el('p', 'brief-eyebrow', 'On démarre'));
    wrap.appendChild(el('h2', 'brief-q', 'Quel type de projet ?'));
    wrap.appendChild(choiceGrid(TYPES, false, (v) => state.projectType === v, (v) => { state.projectType = v; autoNext(); }));
  } else if (step === 2) {
    wrap.appendChild(el('p', 'brief-eyebrow', 'Le pourquoi'));
    wrap.appendChild(el('h2', 'brief-q', 'Ton objectif principal ?'));
    wrap.appendChild(choiceGrid(GOALS, false, (v) => state.goal === v, (v) => { state.goal = v; autoNext(); }));
  } else if (step === 3) {
    wrap.appendChild(el('p', 'brief-eyebrow', 'Le concret'));
    wrap.appendChild(el('h2', 'brief-q', 'Des fonctionnalités en tête ?'));
    wrap.appendChild(el('p', 'brief-hint', 'Plusieurs choix possibles, ou aucun.'));
    wrap.appendChild(choiceGrid(FEATURES, true, (v) => state.features.includes(v), (v) => toggle(state.features, v)));
  } else if (step === 4) {
    wrap.appendChild(el('p', 'brief-eyebrow', 'Le cadre'));
    wrap.appendChild(el('h2', 'brief-q', 'Budget & délai ?'));
    wrap.appendChild(el('span', 'brief-sub', 'Budget indicatif'));
    wrap.appendChild(choiceGrid(BUDGETS, false, (v) => state.budget === v, (v) => { state.budget = v; markSingle(); }));
    wrap.appendChild(el('span', 'brief-sub', 'Pour quand ?'));
    wrap.appendChild(choiceGrid(TIMELINES, false, (v) => state.timeline === v, (v) => { state.timeline = v; markSingle(); }));
  } else if (step === 5) {
    wrap.appendChild(el('p', 'brief-eyebrow', 'La vibe'));
    wrap.appendChild(el('h2', 'brief-q', 'Quelle ambiance ?'));
    wrap.appendChild(el('p', 'brief-hint', 'Le ou les styles qui te parlent.'));
    wrap.appendChild(choiceGrid(STYLES, true, (v) => state.style.includes(v), (v) => toggle(state.style, v)));
    const ta = el('textarea', 'brief-input brief-textarea');
    ta.placeholder = 'Des sites que tu aimes, des références, une inspiration… (optionnel)';
    ta.value = state.refs; ta.maxLength = 600;
    ta.addEventListener('input', () => { state.refs = ta.value; });
    wrap.appendChild(ta);
  } else if (step === 6) {
    wrap.appendChild(el('p', 'brief-eyebrow', 'On se rencontre'));
    wrap.appendChild(el('h2', 'brief-q', 'On reste en contact ?'));
    wrap.appendChild(field('Votre nom *', 'name', 'text', 'Prénom Nom'));
    wrap.appendChild(field('Votre email *', 'email', 'email', 'vous@exemple.com'));
    wrap.appendChild(field('Société (optionnel)', 'company', 'text', 'Nom de votre structure'));
    const ta = el('textarea', 'brief-input brief-textarea');
    ta.placeholder = 'Un mot de plus sur votre projet ? (optionnel)';
    ta.value = state.message; ta.maxLength = 2000;
    ta.addEventListener('input', () => { state.message = ta.value; });
    wrap.appendChild(ta);
    const err = el('p', 'brief-error'); err.id = 'brief-error'; wrap.appendChild(err);
  }
  stage.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('in'));
  syncChrome();
  if (step === 6) { const f = stage.querySelector('input'); if (f) f.focus(); }
  advise(step === 1 && prefilled ? ADVICE_PREFILL : ADVICE[step - 1]);
}

function canNext() {
  if (step === 1) return !!state.projectType;
  if (step === 2) return !!state.goal;
  if (step === 6) return !!state.name.trim() && isEmail(state.email.trim());
  return true;
}
function syncChrome() {
  dots.querySelectorAll('.brief-dot').forEach((d, i) => {
    d.classList.toggle('is-done', i < step - 1);
    d.classList.toggle('is-cur', i === step - 1);
  });
  stepnum.textContent = `Étape ${step} / ${TOTAL}`;
  backBtn.style.visibility = step === 1 ? 'hidden' : '';
  nextBtn.textContent = step === TOTAL ? 'Envoyer mon brief →' : 'Suivant →';
  nextBtn.disabled = !canNext();
}
let autoTimer = 0;
function autoNext() { render(); clearTimeout(autoTimer); autoTimer = window.setTimeout(() => { if (canNext()) next(); }, 320); }
function next() { if (!canNext()) return; if (step === TOTAL) return submit(); step++; render(); }
function back() { if (step === 1) return; step--; render(); }

async function submit() {
  if (sent) return;
  nextBtn.disabled = true; nextBtn.textContent = 'Envoi…';
  const errEl = document.getElementById('brief-error');
  try {
    const res = await fetch('/api/brief', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        projectType: state.projectType, goal: state.goal, features: state.features,
        budget: state.budget, timeline: state.timeline, style: state.style, refs: state.refs,
        company: state.company, name: state.name.trim(), email: state.email.trim(), message: state.message,
      }),
    });
    if (!res.ok) throw new Error('bad status');
    sent = true; success();
  } catch (_e) {
    if (errEl) errEl.textContent = "L'envoi a échoué. Réessayez, ou écrivez à contact@scory.dev.";
    nextBtn.disabled = false; nextBtn.textContent = 'Envoyer mon brief →';
  }
}
function success() {
  nav.style.display = 'none';
  stage.innerHTML = '';
  const s = el('div', 'brief-done');
  s.innerHTML = '<div class="brief-check" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" fill="none"/><path fill="none" d="M14 27l8 8 16-16"/></svg></div>';
  s.appendChild(el('h2', 'brief-q', 'Brief envoyé. Merci !'));
  s.appendChild(el('p', 'brief-muted', `Je reviens vers vous sous 24 h, ${state.name.trim() || ''}. Un email de confirmation part à l'instant.`));
  const home = el('a', 'bf-btn bf-primary', 'Retour à l\'accueil'); home.href = '/';
  s.appendChild(home);
  stage.appendChild(s);
  requestAnimationFrame(() => s.classList.add('in'));
  advise(ADVICE_DONE);
}

nextBtn.addEventListener('click', next);
backBtn.addEventListener('click', back);
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && step === TOTAL && canNext()) { e.preventDefault(); next(); } });

render();
