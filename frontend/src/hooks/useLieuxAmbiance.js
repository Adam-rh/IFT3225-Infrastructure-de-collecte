import { useEffect, useState } from "react";
import { getLocations } from "../api/locations";
import { getNow, getStats } from "../api/ambiance";

/**
 * Enrichit un lieu par fallback progressif :
 * /now en priorité, /stats en secours, "inconnu" en dernier recours.
 */
async function enrichirLieu(loc) {
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
      fresh: true,
    };
  } catch {
    try {
      const { data } = await getStats(loc.name);
      const m = data.data.measurements;
      return {
        ...loc,
        classification: m.overallClassification,
        avgAmplitude: m.avgAmplitude,
        fresh: false,
      };
    } catch {
      return { ...loc, classification: "inconnu", avgAmplitude: null, fresh: false };
    }
  }
}

export function useLieuxAmbiance() {
  const [lieux, setLieux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let annule = false;

    (async () => {
      try {
        const { data } = await getLocations();
        const enrichis = await Promise.all(data.data.map(enrichirLieu));
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
  }, []);

  return { lieux, loading, error };
}