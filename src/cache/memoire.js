// src/cache/memoire.js — cache applicatif en mémoire avec TTL et invalidation par lieu
const entrees = new Map();
const stats = { hits: 0, miss: 0 };

/** Construit une clé de cache normalisée : "quiet-hours:perce-bord-de-mer" */
export function cle(prefixe, location) {
  return `${prefixe}:${location}`;
}

export function lire(k) {
  const entree = entrees.get(k);
  if (!entree) {
    stats.miss++;
    return null;
  }
  if (Date.now() > entree.expireA) {
    entrees.delete(k);
    stats.miss++;
    return null;
  }
  stats.hits++;
  return entree.valeur;
}

export function ecrire(k, valeur, ttlMs) {
  entrees.set(k, { valeur, expireA: Date.now() + ttlMs });
}

/**
 * Invalide les vues dérivées d'un lieu après une écriture.
 * Purge aussi le classement inter-lieux : une mesure sur n'importe quel lieu
 * peut changer l'ordre du classement, sa portée est donc globale.
 */
export function invaliderLieu(location) {
  let supprimees = 0;
  for (const k of entrees.keys()) {
    if (k.endsWith(`:${location}`) || k.startsWith("best:")) {
      entrees.delete(k);
      supprimees++;
    }
  }
  return supprimees;
}

export function vider() {
  entrees.clear();
  stats.hits = 0;
  stats.miss = 0;
}

export function metriques() {
  const total = stats.hits + stats.miss;
  return {
    entrees: entrees.size,
    hits: stats.hits,
    miss: stats.miss,
    tauxHit: total ? Math.round((stats.hits / total) * 100) : 0,
  };
}