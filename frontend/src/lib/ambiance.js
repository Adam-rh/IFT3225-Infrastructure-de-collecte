// Source unique pour les libellés et couleurs d'ambiance.
// Auparavant dupliqué dans MapPage, ListPage et LieuPage.

export const COLORS = {
  calme: "#2ecc71",
  modéré: "#f39c12",
  animé: "#e74c3c",
  inconnu: "#95a5a6",
};

export const SEUIL_FRAICHEUR = "48h";

export function couleurNiveau(classification) {
  return COLORS[classification] ?? COLORS.inconnu;
}

export function niveauHumain(db) {
  if (db === null || db === undefined) return "";
  if (db < 40) return "Très calme";
  if (db < 60) return "Modéré";
  if (db < 75) return "Élevé";
  return "Très élevé";
}