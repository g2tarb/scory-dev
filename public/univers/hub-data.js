/**
 * SCORY — hub-data.js
 * Configuration des 5 rubriques du hub character-select.
 *
 * Chaque rubrique a sa propre couleur accent (style fighting game ou
 * chaque perso a sa palette). Le hub utilise --accent comme variable CSS
 * dynamique mise a jour au survol/rotation.
 */

/**
 * Couleurs alignees sur les ARCHETYPES DYG (Activision Design Language) :
 *   architect #3B82F6  shipper #22C55E  artisan #F5C542  creative #A855F7
 *   explorer  #06B6D4  commando #EF4444  mentor  #F97316  synth    #EC4899
 * Et la primary brand DYG : #E8620A.
 */
export const RUBRIQUES = [
  {
    id: "projets",
    num: "01",
    label: "Projets clients",
    kicker: "Vitrine",
    tagline: "5 livraisons. 100 % sur mesure. Zero template.",
    accent: "#22C55E", // shipper — j'expedie des projets
    archetype: "shipper",
    glyph: "◆",
    route: "/projets",
  },
  {
    id: "devis",
    num: "02",
    label: "Futurs projets",
    kicker: "Devis",
    tagline: "Ta vision, mon code. Sans limites.",
    accent: "#3B82F6", // architect — design et structure du futur projet
    archetype: "architect",
    glyph: "▲",
    route: "/devis",
  },
  {
    id: "apprentissage",
    num: "03",
    label: "Apprentissage",
    kicker: "DYG",
    tagline: "Une plateforme pour devs autodidactes.",
    accent: "#E8620A", // DYG primary brand — cohérent avec l'app cible
    archetype: "dyg",
    glyph: "✦",
    route: "/apprentissage",
    externalUrl: "https://dyg-olfu.onrender.com",
  },
  {
    id: "moi",
    num: "04",
    label: "Moi",
    kicker: "Infos",
    tagline: "Scory — Creative Developer Full-Stack, Paris.",
    accent: "#A855F7", // creative
    archetype: "creative",
    glyph: "●",
    route: "/moi",
  },
  {
    id: "rdv",
    num: "05",
    label: "RDV 10 min",
    kicker: "Gratuit",
    tagline: "Pitch ton projet. 10 minutes. Zero engagement.",
    accent: "#06B6D4", // explorer — premiere rencontre
    archetype: "explorer",
    glyph: "★",
    route: "/rdv",
  },
];

/** Map route -> rubrique pour le router */
export const ROUTE_TO_RUBRIQUE = Object.fromEntries(
  RUBRIQUES.map((r) => [r.route, r]),
);

/** Routes valides (utilisees par le router pour valider l'URL) */
export const VALID_ROUTES = ["/", ...RUBRIQUES.map((r) => r.route)];
