import { classifierAmbiance } from "../config/seuils.js";

const JOURS = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];

function moyenne(valeurs) {
  return valeurs.reduce((s, v) => s + v, 0) / valeurs.length;
}

function arrondir(n) {
  return Math.round(n * 100) / 100;
}

export function calculerSnapshot(mesures, fenetre = "30m") {
  if (!Array.isArray(mesures) || mesures.length === 0) {
    return {
      classification: "inconnu",
      avgAmplitude: null,
      minAmplitude: null,
      maxAmplitude: null,
      measurementCount: 0,
      window: fenetre,
    };
  }
  const valeurs = mesures.map((m) => m.value);
  const moy = moyenne(valeurs);
  return {
    classification: classifierAmbiance(moy),
    avgAmplitude: arrondir(moy),
    minAmplitude: Math.min(...valeurs),
    maxAmplitude: Math.max(...valeurs),
    measurementCount: valeurs.length,
    window: fenetre,
  };
}

export function grouperParHeure(mesures) {
  if (!Array.isArray(mesures) || mesures.length === 0) {
    return { quietest: [], loudest: [], allHours: [] };
  }
  const paquets = new Map();
  for (const m of mesures) {
    const h = new Date(m.timestamp).getHours();
    if (!paquets.has(h)) paquets.set(h, []);
    paquets.get(h).push(m.value);
  }
  const heures = [...paquets.entries()]
    .map(([hour, valeurs]) => {
      const avg = moyenne(valeurs);
      return {
        hour,
        label: `${String(hour).padStart(2,"0")}:00 – ${String((hour+1)%24).padStart(2,"0")}:00`,
        avgAmplitude: arrondir(avg),
        classification: classifierAmbiance(avg),
        sampleCount: valeurs.length,
      };
    })
    .sort((a, b) => a.avgAmplitude - b.avgAmplitude || a.hour - b.hour);
  return {
    quietest: heures.slice(0, 3),
    loudest: heures.slice(-3).reverse(),
    allHours: heures,
  };
}

export function grouperParTranche(mesures, intervalMs = 15 * 60 * 1000) {
  if (!Array.isArray(mesures) || mesures.length === 0) return [];
  const paquets = new Map();
  for (const m of mesures) {
    const t = new Date(m.timestamp).getTime();
    const cle = t - (t % intervalMs);
    if (!paquets.has(cle)) paquets.set(cle, []);
    paquets.get(cle).push(m.value);
  }
  return [...paquets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([cle, valeurs]) => {
      const avg = moyenne(valeurs);
      return {
        window: new Date(cle),
        avgAmplitude: arrondir(avg),
        minAmplitude: Math.min(...valeurs),
        maxAmplitude: Math.max(...valeurs),
        classification: classifierAmbiance(avg),
        measurementCount: valeurs.length,
      };
    });
}

export function calculerStats(mesures = [], observations = []) {
  const valeurs = mesures.map((m) => m.value);
  const avg = valeurs.length ? moyenne(valeurs) : null;

  const parJour = new Map();
  for (const m of mesures) {
    const j = new Date(m.timestamp).getDay();
    if (!parJour.has(j)) parJour.set(j, []);
    parJour.get(j).push(m.value);
  }

  const vibes = new Map();
  for (const o of observations) {
    vibes.set(o.vibe, (vibes.get(o.vibe) || 0) + 1);
  }

  return {
    measurements: {
      total: valeurs.length,
      avgAmplitude: avg !== null ? arrondir(avg) : null,
      minAmplitude: valeurs.length ? Math.min(...valeurs) : null,
      maxAmplitude: valeurs.length ? Math.max(...valeurs) : null,
      overallClassification: classifierAmbiance(avg),
      firstRecord: mesures[0]?.timestamp ?? null,
      lastRecord: mesures.at(-1)?.timestamp ?? null,
    },
    observations: {
      total: observations.length,
      vibeDistribution: [...vibes.entries()]
        .map(([vibe, count]) => ({ vibe, count }))
        .sort((a, b) => b.count - a.count),
    },
    byDayOfWeek: [...parJour.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([j, vals]) => {
        const m = moyenne(vals);
        return {
          day: JOURS[j],
          avgAmplitude: arrondir(m),
          classification: classifierAmbiance(m),
          sampleCount: vals.length,
        };
      }),
  };
}
/** Niveau de confiance dérivé du nombre d'échantillons disponibles */
function niveauConfiance(n) {
  if (n === 0) return "aucune";
  if (n < 5) return "faible";
  if (n < 20) return "moyenne";
  return "bonne";
}

/**
 * Classe les lieux du plus calme au plus animé.
 * @param lieux    documents Location
 * @param mesures  mesures brutes, tous lieux confondus
 * @param heure    0-23 pour filtrer sur une heure précise, null pour tout l'historique
 */
export function classerLieux(lieux, mesures, heure = null) {
  if (!Array.isArray(lieux) || lieux.length === 0) return [];

  const parLieu = new Map();
  for (const m of mesures ?? []) {
    if (heure !== null && new Date(m.timestamp).getHours() !== heure) continue;
    if (!parLieu.has(m.location)) parLieu.set(m.location, []);
    parLieu.get(m.location).push(m.value);
  }

  const classes = lieux.map((l) => {
    const valeurs = parLieu.get(l.name) ?? [];
    const avg = valeurs.length ? moyenne(valeurs) : null;
    return {
      location: l.name,
      label: l.label ?? l.name,
      latitude: l.latitude ?? null,
      longitude: l.longitude ?? null,
      avgAmplitude: avg !== null ? arrondir(avg) : null,
      classification: classifierAmbiance(avg),
      sampleCount: valeurs.length,
      confiance: niveauConfiance(valeurs.length),
    };
  });

  classes.sort((a, b) => {
    const aVide = a.avgAmplitude === null;
    const bVide = b.avgAmplitude === null;
    if (aVide !== bVide) return aVide ? 1 : -1;
    if (aVide) return a.location.localeCompare(b.location);
    if (a.avgAmplitude !== b.avgAmplitude) return a.avgAmplitude - b.avgAmplitude;
    return a.location.localeCompare(b.location);
  });

  return classes;
}