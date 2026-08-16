# SonoMap

**Visualisation de l'ambiance sonore des lieux publics**

IFT3225 — Technologies de l'internet · Université de Montréal · Été 2026
Équipe 15 — Adam Rahmoune, Sami Sabil

---

## Le problème

Vous cherchez un endroit tranquille pour travailler cet après-midi. Vous ne savez pas si le café du coin sera calme à 14 h, ni s'il sera plus bruyant que la bibliothèque d'à côté.

SonoMap répond à cette question à partir de mesures réelles : des relevés de décibels collectés sur le terrain via l'application Phyphox, enrichis d'observations humaines, agrégés puis rendus lisibles sur une carte, en graphiques, et sous forme de classement entre les lieux.

## En ligne

| | Adresse |
|---|---|
| **Application** | https://sonomap.onrender.com |
| **API** | https://sonomap-api.onrender.com |

> Les deux services tournent sur le palier gratuit de Render. Après quinze minutes sans trafic, l'instance s'endort : le premier appel prend alors 30 à 50 secondes le temps du réveil. Les suivants sont immédiats.

---

## Ce qu'apporte la phase 3

Diff complet avec la phase 2 : [`v2.0.0...v3.0.0`](https://github.com/Adam-rh/IFT3225-Infrastructure-de-collecte/compare/v2.0.0...v3.0.0)

**Fonctionnalité additionnelle — « Où aller maintenant ? »**
Toutes les vues précédentes portaient sur un lieu à la fois. Aucune ne permettait de les comparer. Le nouvel endpoint `GET /ambiance/best` classe les lieux du plus calme au plus animé, avec un filtre par heure de la journée, et la vue `/ou-aller` l'expose au visiteur.

**Backend découpé en couches**
`routes/` ne fait plus que traduire requête et réponse. Toute la logique métier vit dans `services/`, sous forme de fonctions pures. L'accès à MongoDB est confiné dans `repositories/`. Les agrégations qui étaient déléguées à MongoDB (`$group`) sont désormais calculées en JavaScript — un arbitrage assumé, détaillé plus bas.

**37 tests unitaires**
Lancés par `npm test`, en environ 300 ms, sans démarrer de serveur ni se connecter à une base.

**Stratégie de cache sur les deux côtés**
Cache applicatif en mémoire côté serveur, cache à deux niveaux côté client, invalidation déclenchée par les écritures.

**Temps réel**
Le flux SSE `GET /ambiance/:location/stream` pousse un instantané toutes les quinze secondes.

**Durcissement**
CORS restreint par variable d'environnement, secret JWT désormais obligatoire au démarrage.

---

## Installation

Le dépôt contient deux projets : l'API à la racine, le client React dans `frontend/`.

```bash
git clone https://github.com/Adam-rh/IFT3225-Infrastructure-de-collecte.git
cd IFT3225-Infrastructure-de-collecte
```

**Backend**

```bash
npm install
cp .env.example .env
```

Ouvrez `.env` et renseignez au minimum `MONGO_URI` et `JWT_SECRET`.

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env
cd ..
```

> Le fichier `.env` n'est pas versionné — le dépôt est public. Un `.env` fonctionnel est fourni séparément dans la remise StudiUM.

**Prérequis :** Node.js ≥ 18 et un cluster MongoDB Atlas (le palier M0 gratuit convient).

## Lancement

Deux terminaux, en parallèle :

```bash
npm run dev
```
```bash
cd frontend && npm run dev
```

L'API écoute sur `http://localhost:3000`, le client sur `http://localhost:5173`.

## Tests

```bash
npm test
```

Les services étant des fonctions pures, la suite s'exécute sans base de données, sans serveur et sans mock.

---

## Variables d'environnement

### Backend — `.env` à la racine

| Variable | Requise | Rôle |
|---|:---:|---|
| `MONGO_URI` | ● | URI de connexion MongoDB Atlas |
| `JWT_SECRET` | ● | Secret de signature des jetons. **L'application refuse de démarrer sans.** |
| `PORT` | | Port d'écoute (défaut 3000 ; injecté par Render en production) |
| `TZ` | | Fuseau horaire — `America/Toronto`. Détermine le découpage des créneaux horaires. |
| `CORS_ORIGIN` | | Origines autorisées, séparées par des virgules |
| `PHYPHOX_HOST`, `BRIDGE_API_KEY`, `BRIDGE_LOCATION`, `BRIDGE_INTERVAL`, `API_URL` | | Bridge Phyphox uniquement (`npm run bridge`) |

### Frontend — `frontend/.env`

| Variable | Rôle |
|---|---|
| `VITE_API_URL` | Adresse de l'API. Injectée **au moment du build** : la modifier exige un redéploiement du client, pas seulement un redémarrage. |

---

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | API avec rechargement automatique |
| `npm start` | API en mode production |
| `npm test` | Suite Vitest |
| `npm run seed-locations` | Insère les trois lieux et leurs coordonnées |
| `npm run load` | Réinjecte les mesures depuis `data-backup/*.csv` |
| `npm run bridge` | Collecte en direct depuis un téléphone Phyphox |
| `npm run export` | Exporte la base vers des CSV |

---

## Architecture

```
src/
  config/          seuils de classification, TTL du cache, secret JWT
  repositories/    accès MongoDB — seuls fichiers important Mongoose
  services/        logique métier, fonctions pures
  routes/          couche mince : requête → service → réponse
  cache/           cache mémoire, TTL et invalidation par lieu
  middlewares/     authentification par clé API et par JWT
  models/          schémas Mongoose

frontend/src/
  lib/             couleurs, seuils et cache client — source unique
  hooks/           useLieuxAmbiance · useFavorites · useLieuData
                   useLiveAmbiance · useBest
  store/           store Zustand des favoris
  components/      NiveauBadge · EtatChargement · EtatErreur · Navbar
  pages/           Map · List · Best · Lieu · Login · Register
                   Submit · Account
  api/             couche Axios avec intercepteur JWT
```

**Une règle gouverne tout le découpage backend :** `services/` n'importe jamais Mongoose. C'est ce qui rend la logique métier testable sans base et mémoïsable au niveau applicatif. Une fonction qui reçoit un tableau et retourne un objet se teste en trois lignes ; un pipeline `$group` ne se teste pas sans serveur MongoDB.

Le même principe s'applique côté client : les pages ne contiennent aucun appel réseau. Elles consomment des hooks, qui consomment la couche `api/`.

---

## Endpoints

### Ambiance

| Méthode | Endpoint | Auth | Cache | Description |
|---|---|:---:|:---:|---|
| GET | `/ambiance/best?heure=0-23` | — | 5 min | Classement des lieux, du plus calme au plus animé |
| GET | `/ambiance/:location/now` | — | — | Instantané des 30 dernières minutes |
| GET | `/ambiance/:location/history?last=30d` | — | 5 min | Série temporelle par tranches de 15 minutes |
| GET | `/ambiance/:location/quiet-hours` | — | 1 h | Moyenne par heure de la journée |
| GET | `/ambiance/:location/stats` | — | 1 h | Statistiques globales du lieu |
| GET | `/ambiance/:location/stream` | — | jamais | Flux SSE, instantané toutes les 15 s |

### Lieux et comptes

| Méthode | Endpoint | Auth |
|---|---|:---:|
| GET | `/locations` · `/locations/:name` | — |
| POST | `/auth/register` · `/auth/login` | — |
| GET | `/users/me` · `/users/me/locations` · `/users/me/stats` | JWT |
| POST · DELETE | `/users/me/favorites` | JWT |
| POST | `/observations/user` | JWT |
| GET | `/observations/mine` | JWT |
| POST | `/measurements` · `/measurements/batch` · `/observations` | Clé API |

Toute réponse susceptible d'être mise en cache porte un en-tête `X-Cache: HIT` ou `MISS`.

---

## Stratégie de cache

### Côté serveur

Cache en mémoire avec durée de vie par type de donnée. Les agrégats historiques (`stats`, `quiet-hours`) vivent une heure : ils bougent lentement. Les vues glissantes (`history`, `best`) vivent cinq minutes.

L'invalidation est déclenchée par les **écritures**, pas par le temps seul. Une nouvelle mesure purge les vues dérivées de ce lieu — et le classement global, dont la portée dépasse un seul lieu : une mesure à Percé peut changer le rang de l'Épicerie IGA.

### Côté client

Deux niveaux. La mémoire pour la session courante ; `localStorage` pour la seule donnée quasi immuable et anonyme, la liste des lieux (24 h).

Les durées de vie côté client sont volontairement **plus courtes** que celles du serveur. Sans cela, une invalidation serveur resterait invisible au navigateur pendant plusieurs minutes. Règle générale : plus on s'éloigne de la source, plus le cache doit être court.

### Ce qui n'est jamais mis en cache

- **Les écritures.** Mettre en cache une écriture n'a aucun sens et masquerait la donnée fraîche.
- **Tout ce qui passe par `requireUser`.** Cacher `/users/me` servirait les favoris d'un utilisateur à un autre : c'est une faille, pas une optimisation.
- **Le flux SSE.** Il porte `Cache-Control: no-cache, no-transform` et `X-Accel-Buffering: no` — sans quoi un proxy le met en tampon et le temps réel disparaît silencieusement.
- **`/now`.** C'est la donnée la plus fraîche de l'application ; la mettre en cache irait contre sa raison d'être.

Le cache client est intégralement purgé à la déconnexion **et** dès qu'un jeton expiré est détecté au démarrage — l'invalidation suit le cycle de vie de la session, pas seulement le clic sur « Déconnexion ».

---

## Données

Les relevés de la phase 1 sont conservés dans `data-backup/` au format CSV — 833 mesures réparties sur trois lieux (Percé bord de mer, Auberge Gaspésie, Épicerie IGA), collectées entre le 16 juin et le 21 juillet 2026. `npm run load` les réinjecte dans un cluster vide.

La classification repose sur deux seuils, définis une seule fois dans `src/config/seuils.js` et repris côté client :

| Niveau | Plage | Repère |
|---|---|---|
| Calme | moins de 40 dB | bibliothèque, conversation douce |
| Modéré | 40 à 60 dB | conversation normale |
| Animé | 60 dB et plus | restaurant, groupe |

---

## Licence

MIT
