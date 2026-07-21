import client from "./client";

export const register = (data) => client.post("/auth/register", data);

export const login = (data) => client.post("/auth/login", data);

export const getMe = () => client.get("/users/me");

export const getMyLocations = () => client.get("/users/me/locations");

export const getMyStats = () => client.get("/users/me/stats");

export const addFavorite = (location) =>
  client.post("/users/me/favorites", { location });

export const removeFavorite = (location) =>
  client.delete(`/users/me/favorites/${location}`);

export const submitObservation = (data) =>
  client.post("/observations/user", data);