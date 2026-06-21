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
  Services: ['Vos services', 'Présente ce que vous proposez en cartes claires : bénéfices et tarifs, pour que le visiteur sache vite si c’est pour lui.'],
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
  da: ['Direction artistique', 'Une identité visuelle sur-mesure : couleurs, typographie, animations. Ce qui fait qu’on se souvient de votre site.'],
  nav: ['Navigation', 'La barre du haut : logo et menu pour se repérer et accéder à chaque section.'],
  cta: ['Bouton d’action', 'L’appel à l’action principal qui guide le visiteur vers l’objectif (devis, achat, RDV).'],
};

// Explications des écrans d'app.
const APP_SCREEN_TIPS = {
  Onboarding: ['Onboarding', 'Les premiers écrans qui présentent l’app et guident l’utilisateur jusqu’à sa première action.'],
  Accueil: ['Accueil / Feed', 'L’écran principal : le fil de contenu ou le tableau de bord que l’utilisateur voit en premier.'],
  Recherche: ['Recherche', 'Barre et filtres pour trouver rapidement un contenu, un produit ou une personne.'],
  Profil: ['Profil', 'L’espace personnel de l’utilisateur : infos, historique, préférences.'],
  Messagerie: ['Messagerie', 'Conversations en temps réel entre utilisateurs ou avec le support.'],
  Notifications: ['Notifications', 'Le centre d’alertes : nouveautés, messages et rappels regroupés.'],
  Paramètres: ['Paramètres', 'Réglages du compte : confidentialité, langue, préférences, déconnexion.'],
};

// Explications des options d'app.
const APP_OPTION_TIPS = {
  auth: ['Authentification', 'Inscription et connexion sécurisées (e-mail, Google, Apple) pour des comptes personnels.'],
  pay: ['Paiement in-app', 'Achats et abonnements directement dans l’app (Stripe, in-app purchase).'],
  push: ['Notifications push', 'Des alertes envoyées sur le téléphone même app fermée, pour faire revenir l’utilisateur.'],
  offline: ['Mode hors-ligne', 'L’app reste utilisable sans connexion : les données se synchronisent au retour du réseau.'],
  geo: ['Géolocalisation', 'Carte et position en temps réel : trouver à proximité, suivre un trajet, livrer.'],
  ia: ['Agent IA', 'Un assistant intégré qui répond, recommande et automatise pour l’utilisateur.'],
  multi: ['Multilingue', 'L’app s’adapte à la langue de l’utilisateur pour une audience internationale.'],
  scan: ['Caméra / Scan', 'Photo, QR codes, scan de documents, directement depuis l’appareil.'],
  tabs: ['Barre de navigation', 'La barre du bas : un onglet par écran principal pour passer de l’un à l’autre.'],
};

// Ordre de page canonique, indépendant de l'ordre de sélection.
const ORDER = ['Accueil', 'Services', 'Réalisations', 'À propos', 'Témoignages', 'Blog', 'Contact'];
const APP_ORDER = ['Accueil', 'Recherche', 'Messagerie', 'Notifications', 'Profil', 'Paramètres', 'Onboarding'];

// Petite icône schématique (carré) pour les onglets.
const tabIcon = () => el('i', 'app-tab-i');

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
  if (has('Direction artistique')) badges.push(['✦ sur-mesure', 'da']);
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

/* ============ Maquette d'APPLICATION (cadre téléphone) ============ */
export function renderAppMockup(host, { blocs = [], options = [] } = {}) {
  const has = (name) => options.includes(name);
  let screens = APP_ORDER.filter((b) => blocs.includes(b));
  if (!screens.length) screens = ['Accueil'];
  const primary = screens.includes('Accueil') ? 'Accueil' : screens[0];

  host.innerHTML = '';
  const screen = el('div', 'app-screen');
  screen.append(el('span', 'app-notch'));

  // Barre du haut : titre + (cadenas auth / langue) + avatar
  const bar = tip(el('div', 'app-bar'), ...(APP_SCREEN_TIPS[primary] || APP_SCREEN_TIPS.Accueil));
  bar.append(el('span', 'app-title'));
  const barR = el('div', 'app-bar-r');
  if (has('Authentification')) barR.append(tip(el('span', 'app-lock', '🔒'), ...APP_OPTION_TIPS.auth));
  if (has('Multilingue')) barR.append(tip(el('span', 'app-lang', 'FR'), ...APP_OPTION_TIPS.multi));
  barR.append(el('span', 'app-avatar'));
  bar.append(barR);
  screen.append(bar);

  // Corps défilable
  const body = el('div', 'app-body');

  if (has('Notifications push')) {
    const toast = tip(el('div', 'app-push'), ...APP_OPTION_TIPS.push);
    toast.append(el('span', 'app-push-ic'));
    const tx = el('div', 'app-col');
    bars(tx, [60, 90]);
    toast.append(tx);
    body.append(toast);
  }
  if (screens.includes('Recherche')) body.append(tip(el('div', 'app-search'), ...APP_SCREEN_TIPS.Recherche));
  if (has('Géolocalisation')) {
    const map = tip(el('div', 'app-map'), ...APP_OPTION_TIPS.geo);
    map.append(el('span', 'app-pin'));
    body.append(map);
  }

  // Bannière (avec bouton « Payer » si Paiement in-app)
  const banner = el('div', 'app-banner');
  if (has('Paiement in-app')) banner.append(tip(el('span', 'app-pay', 'Payer'), ...APP_OPTION_TIPS.pay));
  body.append(banner);

  // Feed : lignes (avatar + texte) si Accueil, sinon cartes
  if (screens.includes('Accueil')) {
    for (let i = 0; i < 4; i++) {
      const row = el('div', 'app-row');
      row.append(el('span', 'app-row-av'));
      const c = el('div', 'app-col');
      bars(c, [80, 55]);
      row.append(c);
      body.append(row);
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const c = el('div', 'app-card');
      bars(c, [70, 92]);
      body.append(c);
    }
  }
  screen.append(body);

  // Barre d'onglets : un par écran (max 5), chacun explicable
  const tabs = tip(el('div', 'app-tabs'), ...APP_OPTION_TIPS.tabs);
  screens.slice(0, 5).forEach((s) => {
    const t = tip(el('div', `app-tab${s === primary ? ' on' : ''}`), ...(APP_SCREEN_TIPS[s] || APP_SCREEN_TIPS.Accueil));
    t.append(tabIcon(), el('span', 'app-tab-l'));
    tabs.append(t);
  });
  screen.append(tabs);
  host.append(screen);

  // Surcouches flottantes
  if (has('Caméra / Scan')) {
    const fab = tip(el('div', 'app-fab'), ...APP_OPTION_TIPS.scan);
    fab.append(el('span', 'app-fab-ic'));
    host.append(fab);
  }
  if (has('Agent IA')) {
    const ai = tip(el('div', 'app-ai'), ...APP_OPTION_TIPS.ia);
    ai.append(el('span', 'app-ai-ic', 'IA'));
    host.append(ai);
  }
  if (has('Mode hors-ligne')) host.append(tip(el('span', 'app-offline', '⤓ hors-ligne'), ...APP_OPTION_TIPS.offline));

  bindTips(host);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) {
    [...body.children].forEach((node, i) => {
      node.style.setProperty('--d', `${i * 50}ms`);
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
  if (host.dataset.tipBound) return; // délégation liée une seule fois
  host.dataset.tipBound = '1';

  const box = getTipBox();
  const bTitle = box.querySelector('b');
  const bText = box.querySelector('span');
  const fill = (t) => { bTitle.textContent = t.dataset.tipTitle || ''; bText.textContent = t.dataset.tipText || ''; };
  const hide = () => box.classList.remove('show');

  // --- Tactile : on TOUCHE un élément pour afficher (re-touche pour fermer) ---
  if (window.matchMedia('(pointer: coarse)').matches) {
    let cur = null;
    const clear = () => { if (cur) cur.classList.remove('mock-tip-on'); cur = null; hide(); };
    host.addEventListener('click', (e) => {
      const t = e.target.closest('.mock-tipable');
      if (!t || cur === t) { clear(); return; }
      if (cur) cur.classList.remove('mock-tip-on');
      cur = t;
      t.classList.add('mock-tip-on');
      fill(t);
      box.classList.add('show');
      window.requestAnimationFrame(() => {
        const r = t.getBoundingClientRect();
        const br = box.getBoundingClientRect();
        let x = r.left + r.width / 2 - br.width / 2;
        let y = r.top - br.height - 10;
        if (y < 10) y = r.bottom + 10; // sinon en dessous de l'élément
        x = Math.max(10, Math.min(x, window.innerWidth - br.width - 10));
        y = Math.max(10, Math.min(y, window.innerHeight - br.height - 10));
        box.style.left = `${x}px`;
        box.style.top = `${y}px`;
      });
    });
    document.addEventListener('click', (e) => { if (!host.contains(e.target)) clear(); });
    return;
  }

  // --- Pointeur fin : survol ---
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
      if (t) { t.classList.add('mock-tip-on'); fill(t); box.classList.add('show'); }
      else hide();
    }
    if (t) place(e.clientX, e.clientY);
  });
  host.addEventListener('mouseleave', () => {
    if (current) current.classList.remove('mock-tip-on');
    current = null;
    hide();
  });
}
