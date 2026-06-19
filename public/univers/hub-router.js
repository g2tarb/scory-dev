/**
 * SCORY — hub-router.js
 * Router SPA vanilla (History API). ~120 lignes.
 *
 * Routes :
 *   /              → hub (roue rotative)
 *   /projets       → pages/projets.html
 *   /devis         → pages/devis.html
 *   /apprentissage → pages/apprentissage.html
 *   /moi           → pages/moi.html
 *   /rdv           → pages/rdv.html
 *
 * Pour la prod : configurer un fallback SPA (vercel.json rewrites) pour que
 * /projets renvoie hub.html. En J1 dev local, on navigue par clic (refresh
 * sur /projets donne 404 en `python -m http.server`, attendu).
 */

import { RUBRIQUES, ROUTE_TO_RUBRIQUE, VALID_ROUTES } from "./hub-data.js";

const root = () => document.getElementById("app-root");

// Helpers couleur ---------------------------------------------------

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function applyAccent(hex) {
  if (!hex) {
    document.body.style.removeProperty("--accent");
    document.body.style.removeProperty("--accent-rgb");
    return;
  }
  document.body.style.setProperty("--accent", hex);
  document.body.style.setProperty("--accent-rgb", hexToRgb(hex));
}

// Cache des partials HTML : evite re-fetch en cas de A/R rapide
const partialCache = new Map();

async function fetchPartial(id) {
  if (partialCache.has(id)) return partialCache.get(id);
  const res = await fetch(`./pages/${id}.html`);
  if (!res.ok) throw new Error(`Page introuvable : ${id} (${res.status})`);
  const html = await res.text();
  partialCache.set(id, html);
  return html;
}

// Cache des modules JS de page : import dynamique, persiste entre navigations.
const moduleCache = new Map();
let currentPageModule = null; // module actuellement monte (pour cleanup)

async function loadPageModule(id) {
  try {
    let mod = moduleCache.get(id);
    if (!mod) {
      mod = await import(`./pages/${id}.js`);
      moduleCache.set(id, mod);
    }
    return mod;
  } catch (err) {
    // Pas de module pour cette rubrique : c'est OK, pas toutes en ont besoin
    return null;
  }
}

// Render ------------------------------------------------------------

// Lazy : injecte par hub.js pour eviter une dependance circulaire wheel ↔ router
let _renderHub = null;
let _destroyHub = null;

export function registerHubRenderer({ renderHub, destroyHub }) {
  _renderHub = renderHub;
  _destroyHub = destroyHub;
}

async function renderRoute(path) {
  const el = root();
  if (!el) return;

  // Phase de sortie : fade + blur
  el.classList.remove("is-entering");
  el.classList.add("is-leaving");
  await new Promise((r) => setTimeout(r, 280));

  // Cleanup wheel si en train de quitter le hub
  if (_destroyHub) _destroyHub();
  // Cleanup module de page courant (ex. scan listeners apprentissage)
  if (currentPageModule && typeof currentPageModule.destroy === "function") {
    try { currentPageModule.destroy(); } catch {}
  }
  currentPageModule = null;
  el.innerHTML = "";

  const isHub = path === "/" || !ROUTE_TO_RUBRIQUE[path];

  // Toggle le mode hub sur body : bloque le scroll de la page (le menu reste
  // plein viewport, la molette est interceptee par la roue pour tourner).
  document.body.classList.toggle("is-hub", isHub);

  if (isHub) {
    // Hub : reset accent + scroll en haut (active la rubrique 01) + render roue
    applyAccent(null);
    window.scrollTo({ top: 0, behavior: "instant" });
    if (_renderHub) _renderHub(el);
  } else {
    // Rubrique : fetch partial + injection
    const rub = ROUTE_TO_RUBRIQUE[path];
    try {
      const html = await fetchPartial(rub.id);
      el.innerHTML = html;
      applyAccent(rub.accent);
      // Scroll top
      window.scrollTo({ top: 0, behavior: "instant" });
      // Charge dynamiquement le module JS de la page si dispo (apprentissage
      // utilise ca pour le scan + redirection vers DYG)
      const mod = await loadPageModule(rub.id);
      if (mod && typeof mod.init === "function") {
        try {
          mod.init();
          currentPageModule = mod;
        } catch (e) {
          console.error(`Init ${rub.id} failed:`, e);
        }
      }
    } catch (err) {
      console.error(err);
      el.innerHTML = `
        <section class="rubrique">
          <h1 class="rubrique__title">404</h1>
          <p class="rubrique__tagline">Page introuvable</p>
          <a href="/" data-route="/" class="rubrique__back">Retour au hub</a>
        </section>
      `;
    }
  }

  // Phase d'entree : fade-in + blur out
  el.classList.remove("is-leaving");
  el.classList.add("is-entering");

  // Focus management : premier element focusable (a11y)
  const focusable = el.querySelector("a[href], button, [tabindex]");
  if (focusable) {
    try { focusable.focus({ preventScroll: true }); } catch {}
  }

  // Update meta titre
  const rub = ROUTE_TO_RUBRIQUE[path];
  document.title = rub
    ? `SCORY — ${rub.label}`
    : "SCORY — Hub";
}

// Navigation publique -----------------------------------------------

export function navigate(path) {
  // Normalisation : si on demande / et qu'on est sur hub.html, garder hub.html
  // (sinon refresh casse en local. En prod c'est rewrite serveur qui gere)
  const currentPath = normalizePath(window.location.pathname);
  if (currentPath !== path) {
    history.pushState({}, "", path);
  }
  renderRoute(path);
}

function normalizePath(p) {
  if (!p || p === "/" || p.endsWith("hub.html") || p.endsWith("index.html"))
    return "/";
  return p;
}

// Init --------------------------------------------------------------

export function initRouter() {
  const initialPath = normalizePath(window.location.pathname);

  // Render initial
  renderRoute(initialPath);

  // Back/forward
  window.addEventListener("popstate", () => {
    renderRoute(normalizePath(window.location.pathname));
  });

  // Intercept clicks sur tout [data-route]
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-route]");
    if (!el) return;
    const route = el.dataset.route;
    if (!VALID_ROUTES.includes(route)) return;
    e.preventDefault();
    navigate(route);
  });
}
