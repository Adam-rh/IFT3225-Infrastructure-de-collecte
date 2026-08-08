import { useEffect, useState } from "react";
import { getStats, getHistory, getQuietHours } from "../api/ambiance";
import { getLocation } from "../api/locations";

function formaterHeure(iso) {
  return new Date(iso).toLocaleString("fr-CA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Charge en parallèle les 4 sources d'un lieu : fiche, stats, historique, créneaux.
 * @param periode fenêtre de l'historique ("7d", "30d", "90d")
 */
export function useLieuData(name, periode = "30d") {
  const [donnees, setDonnees] = useState({
    location: null,
    stats: null,
    history: [],
    quietHours: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let annule = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [locRes, statsRes, histRes, quietRes] = await Promise.all([
          getLocation(name),
          getStats(name),
          getHistory(name, periode),
          getQuietHours(name),
        ]);

        if (annule) return;

        setDonnees({
          location: locRes.data.data,
          stats: statsRes.data.data,
          quietHours: quietRes.data.data,
          history: histRes.data.data.timeline.map((t) => ({
            ...t,
            time: formaterHeure(t.window),
          })),
        });
      } catch {
        if (!annule) setError("Impossible de charger les données de ce lieu.");
      } finally {
        if (!annule) setLoading(false);
      }
    })();

    return () => {
      annule = true;
    };
  }, [name, periode]);

  return { ...donnees, loading, error };
}