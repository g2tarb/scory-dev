/* Fourchettes de prix INDICATIVES (€), basse → haute, par bloc et option.
   Deux tables : site web et application. ⚙️ À ajuster librement, ce sont tes tarifs. */

export const TABLES = {
  site: {
    // Socle : design sur-mesure, intégration, responsive, mise en ligne (hand-coded, zéro template).
    floor: [1500, 2500],
    max: 14000,
    prices: {
      // Blocs de base
      Accueil: [400, 700],
      'À propos': [200, 400],
      Services: [300, 600],
      Réalisations: [300, 650],
      Témoignages: [150, 350],
      Contact: [200, 400],
      Blog: [500, 1200],
      // Options & plus-value
      'Prise de RDV': [400, 900],
      'Paiement en ligne': [800, 2500],
      'Espace membre': [1000, 3000],
      Multilingue: [400, 1000],
      'Agent IA': [1500, 4000],
      Automatisations: [800, 2500],
      'Animations 3D': [1500, 4500],
      'Direction artistique': [800, 3000],
      'SEO avancé': [400, 1000],
    },
  },
  app: {
    // Socle app : architecture, design system, navigation, build iOS/Android, publication stores.
    floor: [2500, 5000],
    max: 40000,
    prices: {
      // Écrans de base
      Onboarding: [400, 900],
      Accueil: [600, 1400],
      Recherche: [500, 1200],
      Profil: [400, 1000],
      Messagerie: [1500, 4000],
      Notifications: [300, 800],
      Paramètres: [300, 700],
      // Options & plus-value
      Authentification: [800, 2000],
      'Paiement in-app': [1200, 3500],
      'Notifications push': [600, 1500],
      'Mode hors-ligne': [1000, 3000],
      Géolocalisation: [1000, 2800],
      'Agent IA': [2000, 5000],
      Multilingue: [500, 1200],
      'Caméra / Scan': [800, 2000],
    },
  },
};

// Échelle de la barre visuelle par type.
export const MAX_SCALE = { site: TABLES.site.max, app: TABLES.app.max };

// Somme des fourchettes des éléments sélectionnés (socle compris).
export function estimate(items, kind = 'site') {
  const table = TABLES[kind] || TABLES.site;
  return items.reduce(
    (acc, name) => {
      const p = table.prices[name];
      if (p) {
        acc[0] += p[0];
        acc[1] += p[1];
      }
      return acc;
    },
    [table.floor[0], table.floor[1]],
  );
}

// Format euro français : 2 400 €.
export const eur = (n) => `${Math.round(n).toLocaleString('fr-FR')} €`;
