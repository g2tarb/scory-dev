/**
 * SCORY — hub.js
 * Entry point unique du nouveau portfolio.
 *
 * Boot sequence :
 *   1. attendre DOMContentLoaded
 *   2. enregistrer le renderer du hub dans le router (DI pour eviter le cycle)
 *   3. initialiser le router → il render la route initiale (/ par defaut)
 */

import { initRouter, navigate, registerHubRenderer } from "./hub-router.js";
import { renderHub, destroyHub } from "./hub-wheel.js";
import { initPageOrbs } from "./hub-orbs.js";
import { initDygBubbles } from "./hub-bubbles.js";

function boot() {
  // Orbes archetype DYG en arriere-plan plein viewport : toujours actif.
  initPageOrbs();

  // Billes DYG concentrees au centre du cercle : tournent en permanence,
  // opacite contrôlée par CSS (.is-rubrique-apprentissage).
  initDygBubbles();

  // Injecte navigate dans renderHub pour que le bouton "Entrer" et les clics
  // sur les nœuds puissent declencher une route sans dependance circulaire.
  const renderHubBound = (root) => renderHub(root, { navigate });
  registerHubRenderer({ renderHub: renderHubBound, destroyHub });
  initRouter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
