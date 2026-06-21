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

// Ordre de page canonique, indépendant de l'ordre de sélection.
const ORDER = ['Accueil', 'Services', 'Réalisations', 'À propos', 'Témoignages', 'Blog', 'Contact'];

function buildSection(kind, has) {
  const s = el('div', 'mock-sec');

  if (kind === 'Accueil') {
    s.className = 'mock-sec mock-hero';
    if (has('Animations 3D')) s.append(el('span', 'mock-orb'));
    const t = el('div', 'mock-hero-t');
    bars(t, [60, 80, 38], 'big');
    s.append(t);
    bars(s, [50]);
    const row = el('div', 'mock-row');
    row.append(el('span', 'mock-btn'), el('span', 'mock-btn ghost'));
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
      if (has('Paiement en ligne')) c.append(el('span', 'mock-price'));
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
      const cal = el('div', 'mock-cal');
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
  if (has('Multilingue')) bar.append(el('span', 'mock-lang', 'FR · EN'));
  host.append(bar);

  // --- Page ---
  const page = el('div', 'mock-page');

  // Header : logo + nav (1 lien par section) + pills optionnelles
  const header = el('div', 'mock-head');
  header.append(el('span', 'mock-logo'));
  const nav = el('div', 'mock-nav');
  sections.filter((s) => s !== 'Accueil').slice(0, 5).forEach(() => nav.append(el('span', 'mock-navi')));
  header.append(nav);
  if (has('Espace membre')) header.append(el('span', 'mock-pill ghost', 'Connexion'));
  if (has('Prise de RDV')) header.append(el('span', 'mock-pill cta', 'RDV'));
  page.append(header);

  // Sections
  sections.forEach((kind) => page.append(buildSection(kind, has)));

  // Footer
  const foot = el('div', 'mock-foot');
  for (let i = 0; i < 4; i++) {
    const col = el('div', 'mock-fcol');
    bars(col, [70, 50, 60]);
    foot.append(col);
  }
  page.append(foot);

  host.append(page);

  // --- Surcouches flottantes (options) ---
  if (has('Agent IA')) {
    const chat = el('div', 'mock-chat');
    chat.append(el('span', 'mock-chat-ai', 'IA'));
    host.append(chat);
  }
  const badges = [];
  if (has('SEO avancé')) badges.push(['SEO 98', 'seo']);
  if (has('Automatisations')) badges.push(['⚙ auto', 'auto']);
  badges.forEach(([txt, cls], i) => {
    const b = el('span', `mock-badge ${cls}`, txt);
    b.style.bottom = `${14 + i * 34}px`;
    host.append(b);
  });

  // Révélation étagée : « génération » vivante mais quasi-instantanée.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) {
    [...page.children].forEach((node, i) => {
      node.style.setProperty('--d', `${i * 55}ms`);
      node.classList.add('mock-in');
    });
  }
}
