import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { addFavorite, removeFavorite, getMe } from "../api/auth";

export function useFavorites() {
  const { user } = useAuth();
  const [favoris, setFavoris] = useState([]);

  useEffect(() => {
    if (!user) {
      setFavoris([]);
      return;
    }
    let annule = false;
    getMe()
      .then((res) => {
        if (!annule) setFavoris(res.data.data.favorites ?? []);
      })
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [user]);

  const estFavori = (nom) => favoris.includes(nom);

  /** Mise à jour optimiste avec retour arrière si l'API échoue */
  const basculer = async (nom) => {
    if (!user) return;
    const precedent = favoris;
    try {
      if (estFavori(nom)) {
        setFavoris(favoris.filter((f) => f !== nom));
        await removeFavorite(nom);
      } else {
        setFavoris([...favoris, nom]);
        await addFavorite(nom);
      }
    } catch {
      setFavoris(precedent);
    }
  };

  return { favoris, estFavori, basculer };
}