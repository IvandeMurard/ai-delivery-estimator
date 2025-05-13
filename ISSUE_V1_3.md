# 🚀 V1.3 – Interface Agent IA & Navigation fluide

## 🎯 Objectif

Repenser l’expérience utilisateur en abandonnant le layout rigide à colonnes, pour passer à une interface moderne guidée par étapes, proche d’un assistant IA. Faciliter la lecture, la navigation et la progression, tout en restant responsive et sobre.

---

## 🧱 Étapes prévues

### 1. 🧠 Refactoring en blocs verticaux modulaires

* [x] Supprimer la structure `grid-cols-4`
* [x] Créer un composant `StepLayout.tsx` pour chaque étape (titre, icône, contenu)
* [x] Empiler les blocs avec `space-y-12`, `max-w-screen-lg`, `mx-auto`, `py-8`

### 2. 🧭 Barre de navigation / Sommaire intelligent

* [x] Créer une `StepNav.tsx` : navigation fixe latérale ou en haut (selon écran)
* [x] Scroll automatique vers la section cliquée (`scrollIntoView`)
* [x] Highlight de la section active via `IntersectionObserver`

### 3. 💡 Structure de navigation logique

* Contexte & Description
* Estimation IA (bloc bleu)
* Timeline + Livraison (bloc vert)
* Conclusion
* Feedback & Historique

### 4. 📱 Mobile-first & responsive

* [x] Passer à une stack verticale complète sur mobile
* [x] Ajouter du `gap-y` généreux et `px-6` sur petits écrans

### 5. 🎨 Design & identité visuelle

* [x] Ajouter des icônes à chaque étape (Lucide / HeroIcons)
* [x] Ajouter des ombres douces, coins arrondis, animations légères
* [x] Préparer un futur mode clair/sombre

---

## 🔁 Option bonus : navigation progressive (wizard stepper)

* [x] Masquer les étapes non atteintes
* [x] Afficher une seule carte à la fois avec boutons "Suivant / Précédent"
* [x] À activer uniquement si besoin d'un mode ultra-guidé

---

*Mis à jour le 10 mai 2025 – Ivan de Murard*
