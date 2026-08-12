import { useEffect, useState } from "react";
import { getBest } from "../api/ambiance";

/** @param heure 0-23 pour filtrer sur une heure, null pour tout l'historique */
export function useBest(heure = null) {
  const [classement, setClassement] = useState([]);
  const [recommandation, setRecommandation] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let annule = false;
    setLoading(true);
    setError(null);

    getBest(heure)
      .then(({ data }) => {
        if (annule) return;
        setClassement(data.data.classement);
        setRecommandation(data.data.recommandation);
        setMeta(data.meta);
      })
      .catch(() => {
        if (!annule) setError("Impossible de charger le classement des lieux.");
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });

    return () => {
      annule = true;
    };
  }, [heure]);

  return { classement, recommandation, meta, loading, error };
}