import { useEffect, useState } from "react";
import { getLocations } from "../api/locations";
import { getNow, getStats } from "../api/ambiance";

/** Enrichit un lieu depuis /stats : classification historique globale. */
async function depuisStats(loc) {
  try {
    const { data } = await getStats(loc.name);
    const m = data.data.measurements;
    return {
      ...loc,
      classification: m.overallClassification,
      avgAmplitude: m.avgAmplitude,
      total: m.total,
      fresh: false,
    };
  } catch {
    return { ...loc, classification: "inconnu", avgAmplitude: null, total: 0, fresh: false };
  }
}

/**
 * Fallback progressif : /now en priorité, /stats en secours,
 * "inconnu" en dernier recours.
 */
async function enrichirLieu(loc, tempsReel) {
  if (!tempsReel) return depuisStats(loc);

  try {
    const { data } = await getNow(loc.name);
    const snap = data.data.snapshot;
    if (snap.classification === "inconnu" || !snap.avgAmplitude) {
      throw new Error("aucune donnée récente");
    }
    return {
      ...loc,
      classification: snap.classification,
      avgAmplitude: snap.avgAmplitude,
      total: snap.measurementCount,
      fresh: true,
    };
  } catch {
    return depuisStats(loc);
  }
}

/**
 * @param tempsReel  true (carte) : tente /now avant /stats.
 *                   false (liste) : classification historique directement.
 */
export function useLieuxAmbiance({ tempsReel = true } = {}) {
  const [lieux, setLieux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let annule = false;

    (async () => {
      try {
        const { data } = await getLocations();
        const enrichis = await Promise.all(
          data.data.map((loc) => enrichirLieu(loc, tempsReel))
        );
        if (!annule) setLieux(enrichis);
      } catch {
        if (!annule) setError("Impossible de charger les lieux.");
      } finally {
        if (!annule) setLoading(false);
      }
    })();

    return () => {
      annule = true;
    };
  }, [tempsReel]);

  return { lieux, loading, error };
}