import client from "./client";

export const getNow = (location) =>
  client.get(`/ambiance/${location}/now`);

export const getHistory = (location, last = "24h") =>
  client.get(`/ambiance/${location}/history?last=${last}`);

export const getQuietHours = (location) =>
  client.get(`/ambiance/${location}/quiet-hours`);

export const getStats = (location) =>
  client.get(`/ambiance/${location}/stats`);