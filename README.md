# Ambiance API — IFT3225

API de collecte et de consultation d'ambiance en quasi temps réel. Le système reçoit des mesures d'amplitude sonore via un capteur Phyphox et des observations environnementales manuelles, les persiste dans MongoDB Atlas, et les rend interrogeables à travers des endpoints sémantiques d'agrégation.

## Prérequis

- **Node.js** ≥ 18 (LTS recommandé)
- **npm** ≥ 9
- **MongoDB Atlas** — un cluster gratuit (M0) suffit
- **Phyphox** — installé sur un téléphone (iOS ou Android)
- **Postman** ou **Bruno** — pour tester les endpoints

## Installation et lancement

```bash
# 1. Cloner le dépôt
git clone https://github.com/Adam-rh/IFT3225-Infrastructure-de-collecte.git
cd IFT3225-Infrastructure-de-collecte

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec votre URI MongoDB Atlas

# 4. Peupler la base avec les données de démonstration
npm run seed

# 5. Lancer le serveur
npm run dev    # mode développement (--watch)
npm start      # mode production
```

Le serveur démarre sur `http://localhost:3000`.

## Configuration `.env`

| Variable | Description |
|---|---|
| `MONGO_URI` | URI de connexion MongoDB Atlas |
| `PORT` | Port du serveur (défaut : 3000) |
| `PHYPHOX_HOST` | IP du téléphone Phyphox (ex: `http://192.168.1.42:8080`) |
| `BRIDGE_API_KEY` | Clé API obtenue via `POST /devices` |
| `API_URL` | URL du serveur API (défaut : `http://localhost:3000`) |
| `BRIDGE_LOCATION` | Identifiant du lieu instrumenté |
| `BRIDGE_INTERVAL` | Intervalle de collecte en secondes (défaut : 5) |

## Table des endpoints

### Gestion des devices

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/devices` | ❌ | Enregistrer un device → retourne `{ id, apiKey }` |
| `GET` | `/devices` | ❌ | Lister les devices (clé masquée) |

### Collecte (écriture — protégé par `x-api-key`)

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/measurements` | ✅ | Soumettre une mesure capteur |
| `POST` | `/measurements/batch` | ✅ | Soumettre un lot de mesures |
| `GET` | `/measurements` | ❌ | Lister les mesures (filtres : `location`, `type`, `since`, `until`, `limit`) |
| `POST` | `/observations` | ✅ | Soumettre une observation environnementale |
| `GET` | `/observations` | ❌ | Lister les observations (filtres : `location`, `vibe`, `since`, `until`, `limit`) |

### Endpoints sémantiques (vues dérivées — lecture publique)

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/ambiance/:location/now` | Portrait instantané (30 dernières min) |
| `GET` | `/ambiance/:location/history?last=3h` | Évolution par tranches de 15 min |
| `GET` | `/ambiance/:location/quiet-hours` | Créneaux typiquement calmes |
| `GET` | `/ambiance/:location/stats` | Statistiques globales du lieu |

### Paramètres de filtrage

- `location` — identifiant du lieu (ex: `cafe-olimpico`)
- `since` / `until` — dates ISO 8601 (ex: `2026-06-10T08:00:00Z`)
- `last` — durée relative (ex: `30m`, `3h`, `6h`, `24h`, `7d`)
- `limit` — nombre max de résultats (défaut : 100, max : 500)

## Authentification

Les endpoints d'écriture (`POST`) sont protégés par une clé API dans l'en-tête `x-api-key`.

```bash
# 1. Enregistrer un device
curl -X POST http://localhost:3000/devices \
  -H "Content-Type: application/json" \
  -d '{"name": "iPhone-1", "location": "cafe-olimpico"}'

# → Conserver la clé apiKey retournée

# 2. Soumettre une mesure
curl -X POST http://localhost:3000/measurements \
  -H "Content-Type: application/json" \
  -H "x-api-key: VOTRE_CLE_ICI" \
  -d '{"type":"amplitude","value":52.3,"location":"cafe-olimpico","timestamp":"2026-06-12T14:00:00Z"}'
```

| Situation | Code | Réponse |
|---|---|---|
| En-tête `x-api-key` absent | `401` | `MISSING_API_KEY` |
| Clé invalide | `403` | `INVALID_API_KEY` |
| Clé valide | `201` | Document créé |

## Bridge Phyphox

Le bridge est un script Node.js qui interroge le capteur Phyphox à intervalle régulier et POST les données vers l'API.

```bash
# 1. Ouvrir "Audio Amplitude" dans Phyphox
# 2. Activer "Accès à distance" (menu ⋮)
# 3. Configurer .env (PHYPHOX_HOST, BRIDGE_API_KEY, etc.)
# 4. Lancer le bridge
npm run bridge
```

## Tests avec Postman

1. Importer les endpoints dans Postman
2. Lancer `npm run seed` pour avoir des données de démo
3. Tester les GET sans authentification
4. Tester les POST avec l'en-tête `x-api-key` (clé affichée par le seed)
5. Vérifier les erreurs 401/403 en omettant ou falsifiant la clé

## Structure du projet

```
ambiance-api/
├── index.js                  ← point d'entrée
├── seed.js                   ← script de données de démo
├── bridge.js                 ← bridge Phyphox → API
├── package.json
├── .env.example
├── .gitignore
└── src/
    ├── app.js                ← création Express + montage des routes
    ├── db.js                 ← connexion MongoDB
    ├── models/
    │   ├── Device.js         ← schéma device (nom, lieu, clé API)
    │   ├── Measurement.js    ← schéma mesure capteur
    │   └── Observation.js    ← schéma observation environnementale
    ├── routes/
    │   ├── devices.js        ← CRUD devices
    │   ├── measurements.js   ← collecte + consultation mesures
    │   ├── observations.js   ← collecte + consultation observations
    │   └── ambiance.js       ← endpoints sémantiques (agrégation)
    └── middlewares/
        └── auth.js           ← vérification x-api-key
```

## Équipe

- **Adam Rahmoune** ([@Adam-rh](https://github.com/Adam-rh))
- **Sami Sabil** ([@samruhix](https://github.com/samruhix))

## Licence

Projet académique — IFT3225, Université de Montréal, été 2026.
