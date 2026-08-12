import client from "./client";
import { lire, ecrire, TTL_CLIENT } from "../lib/cacheClient";

/**
 * La liste des lieux est quasi immuable et anonyme :
 * seule donnée mise en cache de façon persistante (localStorage, 24 h).
 */
export const getLocations = async () => {
  const enCache = lire("locations", { persistant: true });
  if (enCache) return { data: { data: enCache } };

  const res = await client.get("/locations");
  ecrire("locations", res.data.data, TTL_CLIENT.locations, { persistant: true });
  return res;
};

export const getLocation = (name) => client.get(`/locations/${name}`);