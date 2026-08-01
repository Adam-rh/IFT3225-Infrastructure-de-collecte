// src/config/cache.js — durées de vie du cache applicatif
export const TTL = {
  stats: 60 * 60 * 1000,        // 1 h — agrégat historique, bouge lentement
  quietHours: 60 * 60 * 1000,   // 1 h — profil horaire, bouge lentement
  history: 5 * 60 * 1000,       // 5 min — fenêtre glissante
  now: 30 * 1000,               // 30 s — quasi temps réel
};
