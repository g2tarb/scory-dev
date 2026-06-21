/* Fourchettes de prix INDICATIVES (€), basse → haute, par bloc et option.
   ⚙️ À ajuster librement : ce sont tes tarifs, modifie les nombres ici. */

// Socle projet : design, intégration, responsive, mise en ligne.
export const FLOOR = [900, 1600];

// Échelle de la barre visuelle (au-delà, la barre est « pleine »).
export const MAX_SCALE = 14000;

export const PRICES = {
  // — Blocs de base —
  Accueil: [400, 700],
  'À propos': [200, 400],
  Services: [300, 600],
  Réalisations: [300, 650],
  Témoignages: [150, 350],
  Contact: [200, 400],
  Blog: [500, 1200],

  // — Options & plus-value —
  'Prise de RDV': [400, 900],
  'Paiement en ligne': [800, 2500],
  'Espace membre': [1000, 3000],
  Multilingue: [400, 1000],
  'Agent IA': [1500, 4000],
  Automatisations: [800, 2500],
  'Animations 3D': [600, 1800],
  'SEO avancé': [400, 1000],
};

// Somme des fourchettes des éléments sélectionnés (socle compris).
export function estimate(items) {
  return items.reduce(
    (acc, name) => {
      const p = PRICES[name];
      if (p) {
        acc[0] += p[0];
        acc[1] += p[1];
      }
      return acc;
    },
    [FLOOR[0], FLOOR[1]],
  );
}

// Format euro français : 2 400 €.
export const eur = (n) => `${Math.round(n).toLocaleString('fr-FR')} €`;
