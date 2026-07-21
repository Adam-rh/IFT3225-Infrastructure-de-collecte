import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const client = axios.create({
  baseURL: API_URL,
});

// Ajoute le token JWT automatiquement si connecté
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
