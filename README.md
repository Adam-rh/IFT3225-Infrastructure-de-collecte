# SonoMap API — IFT3225

API de collecte et de consultation d'ambiance sonore en quasi temps réel. Le système reçoit des mesures d'amplitude via Phyphox et des observations environnementales, les persiste dans MongoDB Atlas, et les expose à travers des endpoints sémantiques. Phase 2 : authentification utilisateur JWT, coordonnées GPS des lieux, espace compte avec favoris.

## Prérequis

- Node.js ≥ 18
- MongoDB Atlas (cluster M0 gratuit)
- L'application cliente React (dossier `client/`) pour l'interface

## Installation

```bash
git clone https://github.com/Adam-rh/IFT3225-Infrastructure-de-collecte.git
cd IFT3225-Infrastructure-de-collecte
npm install
cp .env.example .env
# Éditer .env avec votre URI MongoDB Atlas et JWT_SECRET
```

## Lancement

```bash
npm run dev    # mode développement
npm start      # mode production
```

Le serveur démarre sur `http://localhost:3000`.

## Configuration .env

| Variable | Description |
|----------|-------------|
| MONGO_URI | URI de connexion MongoDB Atlas |
| PORT | Port du serveur (défaut : 3000) |
| JWT_SECRET | Secret pour signer les tokens JWT |
| PHYPHOX_HOST | IP du téléphone Phyphox |
| BRIDGE_API_KEY | Clé API obtenue via POST /devices |
| API_URL | URL du serveur API |
| BRIDGE_LOCATION | Identifiant du lieu instrumenté |
| BRIDGE_INTERVAL | Intervalle de collecte en secondes (défaut : 5) |

## Scripts utilitaires

| Commande | Description |
|----------|-------------|
| `npm run seed` | Données de démonstration |
| `npm run seed-locations` | Insérer les 3 lieux avec coordonnées GPS |
| `npm run seed-phase2` | 14 mesures + 3 observations Phase 2 |
| `npm run bridge` | Lancer le bridge Phyphox |
| `npm run load` | Recharger les données depuis les CSV |

## Endpoints

### Lieux (Phase 2)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | /locations | Non | Lister tous les lieux avec coordonnées |
| GET | /locations/:name | Non | Un lieu par son slug |
| POST | /locations | Non | Créer un lieu |

### Authentification (Phase 2)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | /auth/register | Non | Créer un compte → retourne JWT |
| POST | /auth/login | Non | Se connecter → retourne JWT |

### Espace compte (Phase 2)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | /users/me | JWT | Mon profil |
| GET | /users/me/locations | JWT | Mes lieux |
| GET | /users/me/stats | JWT | Mes contributions |
| POST | /users/me/favorites | JWT | Ajouter un favori |
| DELETE | /users/me/favorites/:loc | JWT | Retirer un favori |

### Devices (Phase 1)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | /devices | Non | Enregistrer un device → retourne apiKey |
| GET | /devices | Non | Lister les devices |

### Collecte (Phase 1)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | /measurements | x-api-key | Soumettre une mesure |
| POST | /measurements/batch | x-api-key | Soumettre un lot |
| GET | /measurements | Non | Lister les mesures |
| POST | /observations | x-api-key | Soumettre une observation (device) |
| POST | /observations/user | JWT | Soumettre une observation (utilisateur) |
| GET | /observations | Non | Lister les observations |
| GET | /observations/mine | JWT | Mes observations |

### Endpoints sémantiques (Phase 1)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /ambiance/:location/now | Portrait instantané (30 dernières min) |
| GET | /ambiance/:location/history?last=3h | Évolution par tranches de 15 min |
| GET | /ambiance/:location/quiet-hours | Créneaux typiquement calmes |
| GET | /ambiance/:location/stats | Statistiques globales |

## Tester les actions protégées

```bash
# 1. Créer un compte
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"Test","password":"123456"}'

# 2. Utiliser le token retourné pour soumettre une observation
curl -X POST http://localhost:3000/observations/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{"location":"epicerie-iga","proximity":"moyen","vibe":"modéré"}'
```

## Structure

## Équipe

- Adam Rahmoune (@Adam-rh)
- Sami Sabil (@samruhix)

Projet académique — IFT3225, Université de Montréal, été 2026.