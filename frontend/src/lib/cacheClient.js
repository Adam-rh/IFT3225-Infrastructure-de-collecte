/**
 * Cache client à deux niveaux :
 * - mémoire (Map) : rapide, vidé au rechargement de la page
 * - localStorage : survit au rechargement, pour les données quasi statiques
 *
 * Ne JAMAIS mettre en cache ici : les écritures, /users/me*, le flux SSE.
 */

const memoire = new Map();
const PREFIXE = "sonomap:";
const stats = { hits: 0, miss: 0 };

export const TTL_CLIENT = {
  locations: 24 * 60 * 60 * 1000, // 24 h — la liste des lieux bouge très rarement
  best: 2 * 60 * 1000,            // 2 min — plus court que le TTL serveur (5 min)
  lieuData: 60 * 1000,            // 1 min — portrait d'un lieu
};

function estExpire(entree) {
  return Date.now() > entree.expireA;
}

export function lire(cle, { persistant = false } = {}) {
  const enMemoire = memoire.get(cle);
  if (enMemoire) {
    if (!estExpire(enMemoire)) {
      stats.hits++;
      return enMemoire.valeur;
    }
    memoire.delete(cle);
  }

  if (persistant) {
    try {
      const brut = localStorage.getItem(PREFIXE + cle);
      if (brut) {
        const entree = JSON.parse(brut);
        if (!estExpire(entree)) {
          memoire.set(cle, entree);
          stats.hits++;
          return entree.valeur;
        }
        localStorage.removeItem(PREFIXE + cle);
      }
    } catch {
      // localStorage indisponible ou JSON corrompu : on retombe sur le réseau
    }
  }

  stats.miss++;
  return null;
}

export function ecrire(cle, valeur, ttlMs, { persistant = false } = {}) {
  const entree = { valeur, expireA: Date.now() + ttlMs };
  memoire.set(cle, entree);

  if (persistant) {
    try {
      localStorage.setItem(PREFIXE + cle, JSON.stringify(entree));
    } catch {
      // quota dépassé ou mode privé : le cache mémoire suffit
    }
  }
}

/** Après une écriture : purge tout ce qui dérive de ce lieu, plus le classement global. */
export function invaliderLieu(location) {
  for (const cle of [...memoire.keys()]) {
    if (cle.includes(location) || cle.startsWith("best:")) memoire.delete(cle);
  }
  try {
    for (const cle of Object.keys(localStorage)) {
      if (cle.startsWith(PREFIXE) && (cle.includes(location) || cle.includes("best:"))) {
        localStorage.removeItem(cle);
      }
    }
  } catch {
    // ignoré
  }
}

/** À appeler à la déconnexion : rien de personnel ne doit survivre. */
export function viderTout() {
  memoire.clear();
  try {
    for (const cle of Object.keys(localStorage)) {
      if (cle.startsWith(PREFIXE)) localStorage.removeItem(cle);
    }
  } catch {
    // ignoré
  }
  stats.hits = 0;
  stats.miss = 0;
}

export function metriques() {
  const total = stats.hits + stats.miss;
  return {
    entrees: memoire.size,
    hits: stats.hits,
    miss: stats.miss,
    tauxHit: total ? Math.round((stats.hits / total) * 100) : 0,
  };
}