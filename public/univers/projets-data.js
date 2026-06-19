/**
 * SCORY — projets-data.js
 * Roster du character select : chaque projet = un "personnage" avec sa
 * fiche combat (probleme regle, stack, temps de realisation).
 *
 * ⚠ Les durees sont des ESTIMATIONS a faire valider par Erwin.
 */

export const ROSTER = [
  {
    id: "portfolio",
    num: "01",
    name: "Portfolio Scory",
    role: "Musee digital v1",
    accent: "#c9a962",
    portrait: "./image/mediascory.webp",
    glyph: "S",
    problem:
      "Se demarquer des centaines de portfolios template : un musee digital immersif, zero framework, qui prouve la maitrise frontend de bout en bout.",
    stack: ["Three.js", "GLSL", "GSAP", "Vanilla JS", "PWA"],
    duration: "3 semaines",
    url: null,
  },
  {
    id: "4day",
    num: "02",
    name: "4dayvelopment",
    role: "Agence web",
    accent: "#DA5426",
    portrait: "./image/fond4Day.webp",
    glyph: "4",
    problem:
      "Les TPE veulent du sur mesure sans attendre 2 mois : ecosysteme complet (branding, site, automations n8n, devis instantane) livre en 4 jours.",
    stack: ["Node.js", "Express", "Three.js", "GSAP", "n8n", "Zod"],
    duration: "2 semaines",
    url: "https://4dayvelopment.fr/",
  },
  {
    id: "clara",
    num: "03",
    name: "Clara Martinez",
    role: "Coaching premium",
    accent: "#C9A84C",
    portrait: "./image/fondClara.webp",
    glyph: "C",
    problem:
      "Un positionnement haut de gamme casse par un site Wix : direction artistique dark luxe complete, aurora Canvas interactive, conversion vers la methodologie Clarity.",
    stack: ["HTML5", "Canvas API", "Vanilla JS", "Lucide", "Aurora BG"],
    duration: "1 semaine",
    url: "https://clara-martinez-project.vercel.app/",
  },
  {
    id: "jimmy",
    num: "04",
    name: "JIMMY",
    role: "Roman horreur + arene IA",
    accent: "#c41e3a",
    portrait: "./image/fondJimmy.webp",
    glyph: "J",
    problem:
      "Prouver qu'on peut livrer seul une experience narrative complexe : 12 000 lignes de TypeScript strict, combats generes par Gemini Pro, permadeath total, zero dependance.",
    stack: ["TypeScript", "Gemini Pro", "Three.js", "Canvas API", "PWA"],
    duration: "6 semaines",
    url: "https://splendid-malasada-e630ad.netlify.app/",
  },
  {
    id: "dyg",
    num: "05",
    name: "DYG",
    role: "SaaS autodidactes",
    accent: "#E8620A",
    portrait: null,
    glyph: "D",
    problem:
      "Les devs autodidactes n'ont aucun portfolio prouvable face aux ecoles : scan GitHub avec scoring 8 piliers, equipes en synergie temps reel, 36 tables Postgres en prod.",
    stack: ["Fastify 5", "PostgreSQL", "Docker", "JWT", "Three.js"],
    duration: "8 semaines",
    url: "https://dyg-olfu.onrender.com",
  },
  {
    id: "secureats",
    num: "06",
    name: "SecurEats",
    role: "PWA livraison securisee",
    accent: "#22C55E",
    portrait: null,
    glyph: "Q",
    problem:
      "Confusion entre restaurant, livreur et client a la remise des commandes : QR code chiffre AES-256-GCM verifie cote client, PWA installable sans app store.",
    stack: ["Web Crypto", "PWA", "Service Worker", "QR Code", "CSP"],
    duration: "3 semaines",
    url: "https://secure-eats.vercel.app/",
  },
];
