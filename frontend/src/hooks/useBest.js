import { useEffect, useState } from "react";
import { getBest } from "../api/ambiance";
import { lire, ecrire, TTL_CLIENT } from "../lib/cacheClient";

/** @param heure 0-23 pour filtrer sur une heure, null pour tout l'historique */
export function useBest(heure = null) {
  const [classement, setClassement] = useState([]);
  const [recommandation, setRecommandation] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let annule = false;
    const cle = `best:${heure ?? "all"}`;

    const enCache = lire(cle);
    if (enCache) {
      setClassement(enCache.classement);
      setRecommandation(enCache.recommandation);
      setMeta(enCache.meta);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getBest(heure)
      .then(({ data }) => {
        if (annule) return;
        const charge = {
          classement: data.data.classement,
          recommandation: data.data.recommandation,
          meta: data.meta,
        };
        ecrire(cle, charge, TTL_CLIENT.best);
        setClassement(charge.classement);
        setRecommandation(charge.recommandation);
        setMeta(charge.meta);
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