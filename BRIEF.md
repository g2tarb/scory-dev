# Scory — Brief de référence (DA + structure)

> Document de cadrage. **On s'y tient** : toute nouvelle idée de DA passe d'abord par une mise à jour de ce fichier, pas directement dans le code.
> Dernière révision : 2026-06-18.

## 0. Décisions actées (2026-06-18)
- **Hero = sobre, sans 3D** : l'appareil 3D (iPhone→tablette→MacBook) a été testé puis **retiré** sur demande. Le hero reste un hero plein écran classique (eyebrow + titre + mot rotatif + CTA). Vitrine sans effets 3D.
- **Univers = fusion** : `scoryPortfolio` (le vrai portfolio immersif, repo `g2tarb/scoryPortfolio`) est copié dans `public/univers/` → **un seul déploiement**. Le portail « Entrer dans mon univers » joue une transition puis navigue vers `/univers/` (entrée = `index.html`). ⚠️ Le portfolio s'envoie `X-Frame-Options: DENY` → pas d'iframe, on navigue.
- **Scroll fluide global** : Lenis (désactivé si `prefers-reduced-motion`).
- **Micro-animations** : reveals fondu+flou étagés, topbar qui se condense au scroll, boutons magnétiques, aperçu projet flottant au survol des réalisations.

---

## 1. Vision

Un seul site, **deux univers** reliés par un **portail** :

1. **La Vitrine** (par défaut) — page commerciale : on vient découvrir Scory pour confier **son** projet. Objectif : **leads / contact / devis**. Ton **sobre et pro** pour rassurer.
2. **Le Portfolio** (univers perso) — accessible via une **transition immersive**. C'est là que la créativité et les effets vivent. Montre **qui** est Scory et **ce qu'il a vraiment construit**.

> Règle d'or : la **Vitrine rassure** (sobre), le **Portfolio impressionne** (immersif). On ne mélange pas les deux registres.

---

## 2. Architecture

```
/ (Vitrine — sobre & pro)
├── Hero            → accroche + valeur + CTA (devis / voir le portfolio)
├── Services        → ce que je crée (sites, e-commerce, web app/SaaS)
├── Réalisations    → aperçu de projets (pont vers le Portfolio immersif)
├── Process         → comment on travaille
├── (Preuve)        → réassurance / témoignages (si dispo)
└── Contact         → devis / prise de RDV

  ⟶  PORTAIL (transition immersive)  ⟶

/portfolio (Univers perso — immersif & créatif)
└── Mon histoire, mes projets en détail, mes expérimentations
```

- **Accès au portail** : un point d'entrée présent **dès le début** (ex : bouton « Entrer dans mon univers » dans le hero + au survol des réalisations).
- **Transition** : effet « on plonge » (zoom / morph / portail) entre la Vitrine et le Portfolio. Retour possible.

---

## 3. Direction artistique

### 3.1 Vitrine — sobre & pro  ✅ FIGÉ
- **Ambiance** : épurée, premium, beaucoup d'espace, peu d'effets. On enlève l'aurore tourbillonnante, la spirale, le glitch permanent.
- **Fond** : **sombre élégant** — `#0c0c0e` (quasi-noir), texte clair `#ececee`.
- **Accent** : **or `#c9a962`**, une seule couleur, utilisée avec parcimonie (liens, focus, petits détails).
- **Typo** : grotesk propre et pro (**Inter** ou General Sans). Titres en graisse moyenne/semibold, pas géants ni criards. (La grosse ronde "fun" est réservée au Portfolio si besoin.)
- **Mouvement** : sobre — fondus doux, apparitions au scroll discrètes. Aucune animation permanente qui distrait.

### 3.2 Portfolio — immersif & créatif
- **Ambiance** : c'est le terrain de jeu. Effets 3D, aurore, particules, typo expressive, son éventuel — tout ce qui montre la personnalité.
- C'est ici que vivent les expérimentations (façon ancien `scoryPortfolio` : brain 3D, etc.).

### 3.3 Principe
> La Vitrine doit donner envie de **te faire confiance**. Le Portfolio doit donner envie de **te suivre**.

---

## 4. La transition « portail » (concept)

- Déclencheur : bouton/zone « Entrer dans mon univers » (présent dès le hero).
- Effet : on **plonge** (l'écran se resserre / un point lumineux grandit / la vitrine se dissout) → arrivée dans l'univers immersif.
- Retour : un bouton discret « ← Revenir au site ».
- Technique : overlay plein écran + animation (WebGL ou CSS), puis bascule de vue/route.

---

## 5. Ton & copywriting
- Vitrine : **clair, confiant, sans jargon**. Audacieux mais pro (« On transforme les idées en X qui cartonnent »).
- Portfolio : **personnel, libre**.

---

## 6. Contenu  ✅ (montants/email à confirmer)
- **Identité** : nom public = **Scory** / **scory.dev**.
- **Services** : Site vitrine · E-commerce · Web app / SaaS · Refonte.
- **Tarifs** : affichés en **« à partir de »**. Montants à confirmer — provisoires :
  - Site vitrine — **dès 1 500 €**
  - E-commerce — **dès 3 500 €**
  - Web app / SaaS — **sur devis**
- **Projets à montrer** : **DYG · NAKAMA · SecurEats · 4Dayvelopment** (captures dispo pour DYG, NAKAMA, SecurEats).
- **Contact** : **prise de RDV maison** (Fastify + Resend). Email à fournir : `contact@scory.dev` (reçoit les RDV + leads).
- **Preuve sociale** : aucune pour l'instant (on ajoutera témoignages/chiffres plus tard).

---

## 7. Stack technique
- Front : Vanilla JS + Vite (+ Three.js pour le Portfolio immersif).
- Effets lourds **cantonnés au Portfolio** (la Vitrine reste légère pour le SEO/perf).
- SEO : contenu réel dans le DOM (la Vitrine doit être crawlable).

---

## 8. Règles anti-dérive
1. Une idée de DA ⟶ on l'écrit **ici** d'abord, on valide, **puis** on code.
2. La Vitrine reste **sobre** ; les expérimentations vont dans le **Portfolio**.
3. On ne change pas la palette/typo de la Vitrine sans mettre à jour ce fichier.
