# SonoMap — IFT3225 Phase 2

Application React de visualisation d'ambiance sonore. Consomme l'API
Ambiance (Phase 1) pour afficher une carte interactive des lieux,
des graphiques d'historique et de créneaux calmes, et permet la
soumission d'observations par des utilisateurs authentifiés.

## Prérequis

- Node.js (v20.19+ ou v22.12+)
- L'API Ambiance (Phase 1) en marche sur `http://localhost:3000`

## Installation

```bash
npm install
```

## Configuration

Copier `.env.example` en `.env` :

```bash
cp .env.example .env
```

## Lancement

```bash
npm run dev
```

Accessible sur `http://localhost:5173`.

## Tester les actions protégées

1. Cliquer sur Inscription
2. Créer un compte (email, nom, mot de passe)
3. Soumettre une observation via le formulaire
4. Consulter Mon compte pour voir ses contributions et favoris

## Structure

```
src/
  api/           — Couche client isolée (appels vers l'API)
  components/    — Composants réutilisables (Navbar)
  context/       — AuthContext (gestion de session)
  pages/         — Pages (Carte, Liste, Lieu, Login, Register, Submit, Account)
```
