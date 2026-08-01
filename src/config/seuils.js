export const SEUILS = { calme: 40, modere: 60 };

export function classifierAmbiance(avgDb) {
  if (avgDb === null || avgDb === undefined || Number.isNaN(avgDb)) return "inconnu";
  if (avgDb < SEUILS.calme) return "calme";
  if (avgDb < SEUILS.modere) return "modéré";
  return "animé";
}
