// seed-new-measurements.js — 12+ nouvelles mesures pour la Phase 2
import dotenv from "dotenv";
dotenv.config();

import { connecterDB } from "./src/db.js";
import Measurement from "./src/models/Measurement.js";
import Observation from "./src/models/Observation.js";

const now = new Date();

function hoursAgo(h) {
  return new Date(now.getTime() - h * 3600000);
}

const measurements = [
  // Épicerie IGA — 5 mesures
  { type: "amplitude", value: 55.2, location: "epicerie-iga", timestamp: hoursAgo(5) },
  { type: "amplitude", value: 58.7, location: "epicerie-iga", timestamp: hoursAgo(4.5) },
  { type: "amplitude", value: 52.1, location: "epicerie-iga", timestamp: hoursAgo(4) },
  { type: "amplitude", value: 61.3, location: "epicerie-iga", timestamp: hoursAgo(3.5) },
  { type: "amplitude", value: 56.8, location: "epicerie-iga", timestamp: hoursAgo(3) },

  // Auberge Gaspésie — 4 mesures
  { type: "amplitude", value: 48.5, location: "auberge-gaspesie", timestamp: hoursAgo(6) },
  { type: "amplitude", value: 53.2, location: "auberge-gaspesie", timestamp: hoursAgo(5.5) },
  { type: "amplitude", value: 45.9, location: "auberge-gaspesie", timestamp: hoursAgo(5) },
  { type: "amplitude", value: 50.1, location: "auberge-gaspesie", timestamp: hoursAgo(4.5) },

  // Percé bord de mer — 5 mesures
  { type: "amplitude", value: 72.4, location: "perce-bord-de-mer", timestamp: hoursAgo(2) },
  { type: "amplitude", value: 78.1, location: "perce-bord-de-mer", timestamp: hoursAgo(1.5) },
  { type: "amplitude", value: 69.8, location: "perce-bord-de-mer", timestamp: hoursAgo(1) },
  { type: "amplitude", value: 75.5, location: "perce-bord-de-mer", timestamp: hoursAgo(0.5) },
  { type: "amplitude", value: 71.2, location: "perce-bord-de-mer", timestamp: hoursAgo(0.25) },
];

const observations = [
  {
    location: "epicerie-iga",
    proximity: "proche",
    vibe: "modéré",
    notes: "Phase 2 — fin de journée, quelques clients, musique d'ambiance",
    timestamp: hoursAgo(3),
  },
  {
    location: "auberge-gaspesie",
    proximity: "moyen",
    vibe: "calme",
    notes: "Phase 2 — soirée tranquille, peu de monde dans la salle commune",
    timestamp: hoursAgo(5),
  },
  {
    location: "perce-bord-de-mer",
    proximity: "proche",
    vibe: "animé",
    notes: "Phase 2 — vent fort, vagues hautes, quelques touristes",
    timestamp: hoursAgo(1),
  },
];

await connecterDB();

try {
  const insertedM = await Measurement.insertMany(measurements);
  console.log(`✓ ${insertedM.length} mesures insérées`);

  const insertedO = await Observation.insertMany(observations);
  console.log(`✓ ${insertedO.length} observations insérées`);

  console.log("\nRépartition :");
  console.log("  epicerie-iga : 5 mesures + 1 observation");
  console.log("  auberge-gaspesie : 4 mesures + 1 observation");
  console.log("  perce-bord-de-mer : 5 mesures + 1 observation");
  console.log(`\nTotal : ${insertedM.length} mesures, ${insertedO.length} observations`);

  process.exit(0);
} catch (err) {
  console.error("Erreur:", err.message);
  process.exit(1);
}