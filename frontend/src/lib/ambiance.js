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
// Doit rester aligné sur src/config/seuils.js côté serveur
export const SEUILS = { calme: 40, modere: 60 };

export const ECHELLE = [
  { classe: "calme", libelle: "Calme", plage: "0 – 40 dB", flex: 2 },
  { classe: "modéré", libelle: "Modéré", plage: "40 – 60 dB", flex: 1 },
  { classe: "animé", libelle: "Animé", plage: "60 dB et plus", flex: 1 },
];