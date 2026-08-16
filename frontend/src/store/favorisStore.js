import { create } from "zustand";
import { addFavorite, removeFavorite, getMe } from "../api/auth";

/**
 * Source unique de vérité pour les favoris.
 * Auparavant MapPage et AccountPage chargeaient chacune getMe() de leur côté
 * et maintenaient leur propre copie en state : deux sources pour la même donnée.
 */
export const useFavorisStore = create((set, get) => ({
  favoris: [],
  charge: false,
  chargement: false,

  reinitialiser: () => set({ favoris: [], charge: false, chargement: false }),

  /** Idempotent : un seul appel réseau même si plusieurs pages le demandent. */
  charger: async () => {
    if (get().charge || get().chargement) return;
    set({ chargement: true });
    try {
      const res = await getMe();
      set({ favoris: res.data.data.favorites ?? [], charge: true });
    } catch {
      // L'absence de favoris n'est pas une erreur bloquante
    } finally {
      set({ chargement: false });
    }
  },

  /** Mise à jour optimiste avec retour arrière si l'API échoue. */
  basculer: async (nom) => {
    const precedent = get().favoris;
    const estDeja = precedent.includes(nom);

    set({ favoris: estDeja ? precedent.filter((f) => f !== nom) : [...precedent, nom] });

    try {
      if (estDeja) await removeFavorite(nom);
      else await addFavorite(nom);
    } catch {
      set({ favoris: precedent });
    }
  },
}));