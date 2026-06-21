/* Générateur de maquette schématique — instantané, sans dépendance.
   À partir des blocs/options cochés dans l'assembleur, dessine un aperçu
   de site (fenêtre navigateur + sections) qui se régénère en direct. */

const el = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
};

// Ajoute des barres « texte » de largeurs données (en %).
const bars = (parent, widths, cls = '') =>
  widths.forEach((w) => {
    const b = el('span', `mock-line ${cls}`.trim());
    b.style.width = `${w}%`;
    parent.append(b);
  });

// Rend un élément « explicable » : titre + texte affichés au survol.
const tip = (el, title, text) => {
  el.classList.add('mock-tipable');
  el.dataset.tipTitle = title;
  el.dataset.tipText = text;
  return el;
};

// Explications par section (ce que c'est + à quoi ça sert).
const SECTION_TIPS = {
  Accueil: ['Section d’accueil', 'La première impression : accroche, promesse et bouton d’action qui captent le visiteur en 3 secondes.'],
  Services: ['Vos services', 'Présente ce que vous proposez en cartes claires — bénéfices et tarifs — pour que le visiteur sache vite si c’est pour lui.'],
  Réalisations: ['Réalisations', 'Vos projets en images. La preuve concrète de votre savoir-faire : ça rassure et ça convainc.'],
  'À propos': ['À propos', 'Votre histoire et votre visage. Crée la confiance et l’attachement à votre marque.'],
  Témoignages: ['Témoignages', 'La parole de vos clients. La preuve sociale qui lève les derniers doutes avant de vous contacter.'],
  Blog: ['Blog', 'Des articles qui attirent du trafic via Google et démontrent votre expertise sur la durée.'],
  Contact: ['Contact', 'Le point de conversion : formulaire ou prise de RDV pour transformer le visiteur en client.'],
};

// Explications par option / surcouche.
const OPTION_TIPS = {
  rdv: ['Prise de RDV', 'Le visiteur réserve un créneau en ligne, sans échange de mails. Plus de rendez-vous, moins de friction.'],
  paiement: ['Paiement en ligne', 'Vendez et encaissez directement sur le site (CB, Stripe). Le client paie en deux clics.'],
  membre: ['Espace membre', 'Comptes clients sécurisés : connexion, profils et contenu réservé aux inscrits.'],
  multi: ['Multilingue', 'Le site bascule en plusieurs langues pour toucher une audience internationale.'],
  ia: ['Agent IA', 'Un assistant qui répond aux visiteurs 24/7, qualifie les leads et soulage votre support.'],
  orb: ['Animations 3D', 'Des effets immersifs (WebGL / Three.js) qui marquent les esprits et différencient votre image.'],
  seo: ['SEO avancé', 'Optimisation pour Google : structure, vitesse et métadonnées. Plus de visibilité, plus de visiteurs.'],
  auto: ['Automatisations', 'Connecte vos outils (CRM, e-mails, n8n) pour éliminer les tâches répétitives.'],
  nav: ['Navigation', 'La barre du haut : logo et menu pour se repérer et accéder à chaque section.'],
  cta: ['Bouton d’action', 'L’appel à l’action principal qui guide le visiteur vers l’objectif (devis, achat, RDV).'],
};

// Ordre de page canonique, indépendant de l'ordre de sélection.
const ORDER = ['Accueil', 'Services', 'Réalisations', 'À propos', 'Témoignages', 'Blog', 'Contact'];

function buildSection(kind, has) {
  const s = el('div', 'mock-sec');

  if (kind === 'Accueil') {
    s.className = 'mock-sec mock-hero';
    if (has('Animations 3D')) s.append(tip(el('span', 'mock-orb'), ...OPTION_TIPS.orb));
    const t = el('div', 'mock-hero-t');
    bars(t, [60, 80, 38], 'big');
    s.append(t);
    bars(s, [50]);
    const row = el('div', 'mock-row');
    row.append(tip(el('span', 'mock-btn'), ...OPTION_TIPS.cta), el('span', 'mock-btn ghost'));
    s.append(row);
    return s;
  }

  if (kind === 'Services') {
    s.append(el('span', 'mock-h'));
    const g = el('div', 'mock-grid');
    for (let i = 0; i < 3; i++) {
      const c = el('div', 'mock-card');
      c.append(el('span', 'mock-ico'));
      bars(c, [70, 95]);
      if (has('Paiement en ligne')) c.append(tip(el('span', 'mock-price'), ...OPTION_TIPS.paiement));
      g.append(c);
    }
    s.append(g);
    return s;
  }

  if (kind === 'Réalisations') {
    s.append(el('span', 'mock-h'));
    const g = el('div', 'mock-grid');
    for (let i = 0; i < 3; i++) {
      const c = el('div', 'mock-thumb');
      c.append(el('span', 'mock-thumb-cap'));
      g.append(c);
    }
    s.append(g);
    return s;
  }

  if (kind === 'À propos') {
    s.append(el('span', 'mock-h'));
    const split = el('div', 'mock-split');
    const left = el('div', 'mock-col');
    bars(left, [100, 92, 96, 70]);
    const right = el('div', 'mock-portrait');
    split.append(left, right);
    s.append(split);
    return s;
  }

  if (kind === 'Témoignages') {
    s.append(el('span', 'mock-h'));
    const g = el('div', 'mock-grid two');
    for (let i = 0; i < 2; i++) {
      const c = el('div', 'mock-quote');
      bars(c, [96, 88, 60]);
      const who = el('div', 'mock-who');
      who.append(el('span', 'mock-avatar'));
      const lines = el('div', 'mock-col');
      bars(lines, [50, 34]);
      who.append(lines);
      c.append(who);
      g.append(c);
    }
    s.append(g);
    return s;
  }

  if (kind === 'Blog') {
    s.append(el('span', 'mock-h'));
    const g = el('div', 'mock-grid');
    for (let i = 0; i < 3; i++) {
      const c = el('div', 'mock-card article');
      c.append(el('span', 'mock-cover'));
      bars(c, [85, 55]);
      g.append(c);
    }
    s.append(g);
    return s;
  }

  if (kind === 'Contact') {
    s.append(el('span', 'mock-h'));
    if (has('Prise de RDV')) {
      // Mini-calendrier de prise de rendez-vous.
      const cal = tip(el('div', 'mock-cal'), ...OPTION_TIPS.rdv);
      const on = new Set([4, 5, 9, 12, 16]);
      for (let i = 0; i < 21; i++) {
        const d = el('span', 'mock-day');
        if (on.has(i)) d.classList.add('on');
        cal.append(d);
      }
      s.append(cal);
    } else {
      const form = el('div', 'mock-form');
      form.append(el('span', 'mock-input'), el('span', 'mock-input'), el('span', 'mock-input tall'));
      form.append(el('span', 'mock-btn'));
      s.append(form);
    }
    return s;
  }

  return s;
}

export function renderMockup(host, { blocs = [], options = [] } = {}) {
  const has = (name) => options.includes(name);
  let sections = ORDER.filter((b) => blocs.includes(b));
  if (!sections.includes('Accueil')) sections = ['Accueil', ...sections]; // toujours une home

  host.innerHTML = '';

  // --- Chrome navigateur ---
  const bar = el('div', 'mock-bar');
  bar.append(el('span', 'mock-dot r'), el('span', 'mock-dot y'), el('span', 'mock-dot g'));
  bar.append(el('span', 'mock-url', has('Multilingue') ? 'votre-site.fr/fr' : 'votre-site.fr'));
  if (has('Multilingue')) bar.append(tip(el('span', 'mock-lang', 'FR · EN'), ...OPTION_TIPS.multi));
  host.append(bar);

  // --- Page ---
  const page = el('div', 'mock-page');

  // Header : logo + nav (1 lien par section) + pills optionnelles
  const header = tip(el('div', 'mock-head'), ...OPTION_TIPS.nav);
  header.append(el('span', 'mock-logo'));
  const nav = el('div', 'mock-nav');
  sections.filter((s) => s !== 'Accueil').slice(0, 5).forEach(() => nav.append(el('span', 'mock-navi')));
  header.append(nav);
  if (has('Espace membre')) header.append(tip(el('span', 'mock-pill ghost', 'Connexion'), ...OPTION_TIPS.membre));
  if (has('Prise de RDV')) header.append(tip(el('span', 'mock-pill cta', 'RDV'), ...OPTION_TIPS.rdv));
  page.append(header);

  // Sections (chacune explicable au survol)
  sections.forEach((kind) => page.append(tip(buildSection(kind, has), ...SECTION_TIPS[kind])));

  // Footer
  const foot = el('div', 'mock-foot');
  for (let i = 0; i < 4; i++) {
    const col = el('div', 'mock-fcol');
    bars(col, [70, 50, 60]);
    foot.append(col);
  }
  page.append(foot);

  // La page défile à l'intérieur de la fenêtre (hauteur fixe) ;
  // les widgets flottants (chat, badges) restent ancrés au cadre visible.
  const view = el('div', 'mock-view');
  view.append(page);
  host.append(view);

  // --- Surcouches flottantes (options) ---
  if (has('Agent IA')) {
    const chat = tip(el('div', 'mock-chat'), ...OPTION_TIPS.ia);
    chat.append(el('span', 'mock-chat-ai', 'IA'));
    host.append(chat);
  }
  const badges = [];
  if (has('SEO avancé')) badges.push(['SEO 98', 'seo']);
  if (has('Automatisations')) badges.push(['⚙ auto', 'auto']);
  badges.forEach(([txt, cls], i) => {
    const b = tip(el('span', `mock-badge ${cls}`, txt), ...OPTION_TIPS[cls]);
    b.style.bottom = `${14 + i * 34}px`;
    host.append(b);
  });

  bindTips(host); // tooltips au survol (lié une seule fois)

  // Révélation étagée : « génération » vivante mais quasi-instantanée.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) {
    [...page.children].forEach((node, i) => {
      node.style.setProperty('--d', `${i * 55}ms`);
      node.classList.add('mock-in');
    });
  }
}

/* ----- Tooltips explicatifs au survol ----- */
let tipBox = null;
function getTipBox() {
  if (tipBox) return tipBox;
  tipBox = document.createElement('div');
  tipBox.className = 'mock-tip';
  tipBox.innerHTML = '<b></b><span></span>';
  document.body.append(tipBox);
  return tipBox;
}

function bindTips(host) {
  // Inutile sur tactile (pas de survol) + délégation liée une seule fois.
  if (host.dataset.tipBound || window.matchMedia('(pointer: coarse)').matches) return;
  host.dataset.tipBound = '1';

  const box = getTipBox();
  const bTitle = box.querySelector('b');
  const bText = box.querySelector('span');
  let current = null;

  const place = (x, y) => {
    const pad = 14;
    const r = box.getBoundingClientRect();
    let nx = x + 18;
    let ny = y + 18;
    if (nx + r.width + pad > window.innerWidth) nx = x - r.width - 18;
    if (ny + r.height + pad > window.innerHeight) ny = y - r.height - 18;
    box.style.left = `${Math.max(pad, nx)}px`;
    box.style.top = `${Math.max(pad, ny)}px`;
  };

  host.addEventListener('mousemove', (e) => {
    const t = e.target.closest('.mock-tipable');
    if (t !== current) {
      if (current) current.classList.remove('mock-tip-on');
      current = t;
      if (t) {
        t.classList.add('mock-tip-on');
        bTitle.textContent = t.dataset.tipTitle || '';
        bText.textContent = t.dataset.tipText || '';
        box.classList.add('show');
      } else {
        box.classList.remove('show');
      }
    }
    if (t) place(e.clientX, e.clientY);
  });

  host.addEventListener('mouseleave', () => {
    if (current) current.classList.remove('mock-tip-on');
    current = null;
    box.classList.remove('show');
  });
}
