import client from "./client";

export const getNow = (location) => client.get(`/ambiance/${location}/now`);

export const getStats = (location) => client.get(`/ambiance/${location}/stats`);

export const getHistory = (location, last = "7d") =>
  client.get(`/ambiance/${location}/history`, { params: { last } });

export const getQuietHours = (location) => client.get(`/ambiance/${location}/quiet-hours`);

export const getBest = (heure) =>
  client.get("/ambiance/best", {
    params: heure !== null && heure !== undefined ? { heure } : {},
  });