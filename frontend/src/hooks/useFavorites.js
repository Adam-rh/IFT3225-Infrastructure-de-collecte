import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useFavorisStore } from "../store/favorisStore";

/**
 * Interface inchangée depuis le refactor des hooks : les pages qui
 * l'utilisaient déjà n'ont pas eu à bouger. Seule l'implémentation
 * est passée du state local au store.
 */
export function useFavorites() {
  const { user } = useAuth();
  const favoris = useFavorisStore((s) => s.favoris);
  const charger = useFavorisStore((s) => s.charger);
  const reinitialiser = useFavorisStore((s) => s.reinitialiser);
  const basculer = useFavorisStore((s) => s.basculer);

  useEffect(() => {
    if (user) charger();
    else reinitialiser();
  }, [user, charger, reinitialiser]);

  return {
    favoris,
    estFavori: (nom) => favoris.includes(nom),
    basculer,
  };
}