// src/app.js
import express from "express";
import cors from "cors";

import devicesRouter from "./routes/devices.js";
import measurementsRouter from "./routes/measurements.js";
import observationsRouter from "./routes/observations.js";
import ambianceRouter from "./routes/ambiance.js";
import locationsRouter from "./routes/locations.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";

const app = express();

// ─── Middlewares globaux ─────────────────────────────────────────────
const originesAutorisees = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origine, callback) {
      // Pas d'origine = appel serveur-à-serveur (bridge Phyphox, curl) : autorisé
      if (!origine) return callback(null, true);
      if (originesAutorisees.includes(origine)) return callback(null, true);
      callback(new Error(`Origine non autorisée : ${origine}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────
app.use("/devices", devicesRouter);
app.use("/measurements", measurementsRouter);
app.use("/observations", observationsRouter);
app.use("/ambiance", ambianceRouter);
app.use("/locations", locationsRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);

// ─── Route racine ────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "API Ambiance — IFT3225",
    version: "2.0.0",
    endpoints: {
      devices: "/devices",
      measurements: "/measurements",
      observations: "/observations",
      ambiance: "/ambiance/:location/now | /history | /quiet-hours | /stats | /stream",
      locations: "/locations",
      auth: "/auth/register | /auth/login",
      users: "/users/me | /users/me/locations | /users/me/stats | /users/me/favorites",
    },
  });
});

// ─── 404 catch-all ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `La route ${req.method} ${req.originalUrl} n'existe pas.`,
    },
  });
});

// ─── Gestionnaire d'erreurs global ───────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("Erreur serveur:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Erreur interne du serveur.",
    },
  });
});

export default app;