import client from "./client";

export const getLocations = () => client.get("/locations");

export const getLocation = (name) => client.get(`/locations/${name}`);