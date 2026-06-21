/* Wizard de brief projet — modale multi-étapes, fun et soignée.
   Collecte un brief riche, puis l'envoie au backend (POST /api/brief). */

const TOTAL = 6;

const TYPES = [
  { v: 'Site vitrine', i: '🖥️' },
  { v: 'E-commerce', i: '🛒' },
  { v: 'Web app / SaaS', i: '⚙️' },
  { v: 'Application mobile', i: '📱' },
  { v: 'Refonte', i: '🔁' },
  { v: 'Autre', i: '✨' },
];
const GOALS = [
  { v: 'Vendre en ligne', i: '💸' },
  { v: 'Générer des leads', i: '🎯' },
  { v: 'Image de marque', i: '👑' },
  { v: 'Recruter', i: '🤝' },
  { v: 'Me lancer', i: '🚀' },
  { v: 'Autre', i: '✨' },
];
const FEATURES = ['Prise de RDV', 'Paiement en ligne', 'Espace membre', 'Blog', 'Multilingue', 'Agent IA', 'Animations 3D', 'SEO avancé', 'Tableau de bord', 'Notifications'];
const BUDGETS = ['Moins de 2 000 €', '2 à 5 000 €', '5 à 10 000 €', 'Plus de 10 000 €', 'À définir'];
const TIMELINES = ['Au plus vite', 'Sous 1 mois', '2 à 3 mois', 'Pas pressé'];
const STYLES = ['Épuré', 'Premium', 'Coloré', 'Sombre', 'Joueur', 'Corporate', 'Minimal', 'Audacieux'];

const el = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
};
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export function initBrief() {
  const state = {
    projectType: '', goal: '', features: [], budget: '', timeline: '',
    style: [], refs: '', name: '', email: '', company: '', message: '',
  };
  let step = 1;
  let sent = false;

  /* ---------- Squelette de la modale ---------- */
  const overlay = el('div', 'brief-overlay');
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="brief-modal glass" role="dialog" aria-modal="true" aria-label="Décrire mon projet">
      <button class="brief-close" type="button" aria-label="Fermer">&times;</button>
      <div class="brief-head">
        <div class="brief-dots" aria-hidden="true"></div>
        <span class="brief-stepnum"></span>
      </div>
      <div class="brief-stage" aria-live="polite"></div>
      <div class="brief-nav">
        <button class="brief-back btn btn-link" type="button">← Retour</button>
        <button class="brief-next btn btn-glow" type="button"></button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const modal = overlay.querySelector('.brief-modal');
  const stage = overlay.querySelector('.brief-stage');
  const dots = overlay.querySelector('.brief-dots');
  const stepnum = overlay.querySelector('.brief-stepnum');
  const backBtn = overlay.querySelector('.brief-back');
  const nextBtn = overlay.querySelector('.brief-next');
  const nav = overlay.querySelector('.brief-nav');

  for (let i = 0; i < TOTAL; i++) dots.appendChild(el('span', 'brief-dot'));

  /* ---------- Construction des cartes / chips ---------- */
  function choiceGrid(items, isMulti, getActive, onPick) {
    const grid = el('div', 'brief-grid');
    items.forEach((it) => {
      const v = typeof it === 'string' ? it : it.v;
      const icon = typeof it === 'string' ? null : it.i;
      const b = el('button', 'brief-choice');
      b.type = 'button';
      if (icon) b.appendChild(el('span', 'brief-choice__i', icon));
      b.appendChild(el('span', 'brief-choice__l', v));
      const sync = () => b.classList.toggle('is-on', getActive(v));
      sync();
      b.addEventListener('click', () => { onPick(v); if (isMulti) sync(); });
      grid.appendChild(b);
    });
    return grid;
  }

  /* ---------- Rendu d'une étape ---------- */
  function render() {
    stage.innerHTML = '';
    nav.style.display = '';
    const wrap = el('div', 'brief-step');

    if (step === 1) {
      wrap.appendChild(el('p', 'brief-eyebrow', 'On démarre'));
      wrap.appendChild(el('h3', 'brief-q', 'Quel type de projet ?'));
      wrap.appendChild(choiceGrid(TYPES, false, (v) => state.projectType === v, (v) => { state.projectType = v; autoNext(); }));
    } else if (step === 2) {
      wrap.appendChild(el('p', 'brief-eyebrow', 'Le pourquoi'));
      wrap.appendChild(el('h3', 'brief-q', 'Ton objectif principal ?'));
      wrap.appendChild(choiceGrid(GOALS, false, (v) => state.goal === v, (v) => { state.goal = v; autoNext(); }));
    } else if (step === 3) {
      wrap.appendChild(el('p', 'brief-eyebrow', 'Le concret'));
      wrap.appendChild(el('h3', 'brief-q', 'Des fonctionnalités en tête ?'));
      wrap.appendChild(el('p', 'brief-hint', 'Plusieurs choix possibles, ou aucun.'));
      wrap.appendChild(choiceGrid(FEATURES, true, (v) => state.features.includes(v), (v) => toggle(state.features, v)));
    } else if (step === 4) {
      wrap.appendChild(el('p', 'brief-eyebrow', 'Le cadre'));
      wrap.appendChild(el('h3', 'brief-q', 'Budget & délai ?'));
      wrap.appendChild(el('span', 'brief-sub', 'Budget indicatif'));
      wrap.appendChild(choiceGrid(BUDGETS, false, (v) => state.budget === v, (v) => { state.budget = v; rerenderKeep(); }));
      wrap.appendChild(el('span', 'brief-sub', 'Pour quand ?'));
      wrap.appendChild(choiceGrid(TIMELINES, false, (v) => state.timeline === v, (v) => { state.timeline = v; rerenderKeep(); }));
    } else if (step === 5) {
      wrap.appendChild(el('p', 'brief-eyebrow', 'La vibe'));
      wrap.appendChild(el('h3', 'brief-q', 'Quelle ambiance ?'));
      wrap.appendChild(el('p', 'brief-hint', 'Le ou les styles qui te parlent.'));
      wrap.appendChild(choiceGrid(STYLES, true, (v) => state.style.includes(v), (v) => toggle(state.style, v)));
      const ta = el('textarea', 'brief-input brief-textarea');
      ta.placeholder = 'Des sites que tu aimes, des références, une inspiration… (optionnel)';
      ta.value = state.refs;
      ta.maxLength = 600;
      ta.addEventListener('input', () => { state.refs = ta.value; });
      wrap.appendChild(ta);
    } else if (step === 6) {
      wrap.appendChild(el('p', 'brief-eyebrow', 'On se rencontre'));
      wrap.appendChild(el('h3', 'brief-q', 'On reste en contact ?'));
      wrap.appendChild(field('Votre nom *', 'name', 'text', 'Prénom Nom'));
      wrap.appendChild(field('Votre email *', 'email', 'email', 'vous@exemple.com'));
      wrap.appendChild(field('Société (optionnel)', 'company', 'text', 'Nom de votre structure'));
      const ta = el('textarea', 'brief-input brief-textarea');
      ta.placeholder = 'Un mot de plus sur votre projet ? (optionnel)';
      ta.value = state.message;
      ta.maxLength = 2000;
      ta.addEventListener('input', () => { state.message = ta.value; });
      wrap.appendChild(ta);
      const err = el('p', 'brief-error');
      err.id = 'brief-error';
      wrap.appendChild(err);
    }

    stage.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('in'));
    syncChrome();
    focusFirst();
  }

  function field(label, key, type, ph) {
    const w = el('label', 'brief-field');
    w.appendChild(el('span', 'brief-label', label));
    const input = el('input', 'brief-input');
    input.type = type;
    input.placeholder = ph;
    input.value = state[key];
    input.autocomplete = key === 'email' ? 'email' : key === 'name' ? 'name' : 'organization';
    input.addEventListener('input', () => { state[key] = input.value; syncChrome(); });
    w.appendChild(input);
    return w;
  }

  /* ---------- Logique ---------- */
  const toggle = (arr, v) => {
    const i = arr.indexOf(v);
    if (i === -1) arr.push(v); else arr.splice(i, 1);
  };
  // Re-synchronise juste l'état des chips d'un choix unique sans tout reconstruire.
  function rerenderKeep() {
    stage.querySelectorAll('.brief-grid').forEach((g, gi) => {
      const set = step === 4 ? (gi === 0 ? state.budget : state.timeline) : null;
      if (set == null) return;
      g.querySelectorAll('.brief-choice').forEach((b) => {
        b.classList.toggle('is-on', b.querySelector('.brief-choice__l').textContent === set);
      });
    });
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
  function autoNext() {
    render(); // reflète la sélection
    clearTimeout(autoTimer);
    autoTimer = window.setTimeout(() => { if (canNext()) next(); }, 320);
  }

  function focusFirst() {
    const target = stage.querySelector('input, textarea') || stage.querySelector('.brief-choice');
    if (target && step === 6) target.focus();
  }

  function next() {
    if (!canNext()) return;
    if (step === TOTAL) return submit();
    step++;
    render();
  }
  function back() {
    if (step === 1) return;
    step--;
    render();
  }

  async function submit() {
    if (sent) return;
    nextBtn.disabled = true;
    nextBtn.textContent = 'Envoi…';
    const errEl = overlay.querySelector('#brief-error');
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          projectType: state.projectType, goal: state.goal, features: state.features,
          budget: state.budget, timeline: state.timeline, style: state.style, refs: state.refs,
          company: state.company, name: state.name.trim(), email: state.email.trim(), message: state.message,
        }),
      });
      if (!res.ok) throw new Error('bad status');
      sent = true;
      success();
    } catch {
      if (errEl) errEl.textContent = "L'envoi a échoué. Réessayez, ou écrivez à contact@scory.dev.";
      nextBtn.disabled = false;
      nextBtn.textContent = 'Envoyer mon brief →';
    }
  }

  function success() {
    nav.style.display = 'none';
    stage.innerHTML = '';
    const s = el('div', 'brief-done');
    s.innerHTML =
      '<div class="brief-check" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" fill="none"/><path fill="none" d="M14 27l8 8 16-16"/></svg></div>';
    s.appendChild(el('h3', 'brief-q', 'Brief envoyé. Merci !'));
    s.appendChild(el('p', 'brief-muted', `Je reviens vers vous sous 24 h, ${state.name.trim() || ''}. Un email de confirmation part à l'instant.`));
    const close = el('button', 'btn btn-primary', 'Parfait, fermer');
    close.type = 'button';
    close.addEventListener('click', api.close);
    s.appendChild(close);
    stage.appendChild(s);
    requestAnimationFrame(() => s.classList.add('in'));
  }

  /* ---------- Ouverture / fermeture ---------- */
  let prevFocus = null;
  const api = {
    open() {
      step = 1; sent = false;
      Object.assign(state, { projectType: '', goal: '', features: [], budget: '', timeline: '', style: [], refs: '', name: '', email: '', company: '', message: '' });
      overlay.hidden = false;
      prevFocus = document.activeElement;
      document.body.classList.add('brief-open');
      requestAnimationFrame(() => { overlay.classList.add('is-open'); render(); });
    },
    close() {
      overlay.classList.remove('is-open');
      document.body.classList.remove('brief-open');
      window.setTimeout(() => { overlay.hidden = true; }, 280);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    },
  };

  nextBtn.addEventListener('click', next);
  backBtn.addEventListener('click', back);
  overlay.querySelector('.brief-close').addEventListener('click', api.close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) api.close(); });
  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') api.close();
    if (e.key === 'Enter' && step === TOTAL && canNext()) { e.preventDefault(); next(); }
  });

  return api;
}
