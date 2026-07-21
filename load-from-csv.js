// load-from-csv.js — Recharge les données depuis les fichiers CSV vers MongoDB
//
// Usage :
//   node load-from-csv.js
//
// Attend que le dossier data-backup/ existe avec les CSV générés par export-data.js
// ⚠️  ATTENTION : ce script vide d'abord les collections avant de recharger.

import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Device from "./src/models/Device.js";
import Measurement from "./src/models/Measurement.js";
import Observation from "./src/models/Observation.js";

const INPUT_DIR = "./data-backup";

// Parse un CSV en tableau d'objets
function parseCSV(content) {
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || null;
    });
    return obj;
  });
}

// Parse une ligne CSV en respectant les guillemets
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function loadFromCSV() {
  console.log("🔌 Connexion à MongoDB Atlas...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connecté\n");

  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ Le dossier ${INPUT_DIR}/ n'existe pas.`);
    console.error("   Lancez d'abord : node export-data.js");
    process.exit(1);
  }

  // ─── Vider les collections existantes ─────────────────────────
  console.log("🗑️  Vidage des collections existantes...");
  await Device.deleteMany({});
  await Measurement.deleteMany({});
  await Observation.deleteMany({});
  console.log("   ✅ Collections vidées\n");

  // ─── Devices ──────────────────────────────────────────────────
  const devicesPath = path.join(INPUT_DIR, "devices.csv");
  if (fs.existsSync(devicesPath)) {
    console.log("📱 Chargement des devices...");
    const rows = parseCSV(fs.readFileSync(devicesPath, "utf-8"));
    const devices = rows.map((r) => ({
      _id: new mongoose.Types.ObjectId(r._id),
      name: r.name,
      location: r.location,
      apiKey: r.apiKey,
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
    }));
    await Device.insertMany(devices);
    console.log(`   ✅ ${devices.length} devices chargés\n`);
  }

  // ─── Measurements ─────────────────────────────────────────────
  console.log("📊 Chargement des mesures...");
  const files = fs.readdirSync(INPUT_DIR);
  let totalMeasurements = 0;
  for (const file of files) {
    if (!file.startsWith("measurements-") || !file.endsWith(".csv")) continue;
    const rows = parseCSV(fs.readFileSync(path.join(INPUT_DIR, file), "utf-8"));
    const measurements = rows.map((r) => ({
      _id: new mongoose.Types.ObjectId(r._id),
      type: r.type,
      value: parseFloat(r.value),
      unit: r.unit,
      location: r.location,
      deviceId: r.deviceId ? new mongoose.Types.ObjectId(r.deviceId) : null,
      timestamp: new Date(r.timestamp),
      receivedAt: r.receivedAt ? new Date(r.receivedAt) : new Date(),
    }));
    await Measurement.insertMany(measurements);
    totalMeasurements += measurements.length;
    console.log(`   ✅ ${measurements.length} mesures depuis ${file}`);
  }
  console.log(`   📊 Total : ${totalMeasurements} mesures\n`);

  // ─── Observations ─────────────────────────────────────────────
  const obsPath = path.join(INPUT_DIR, "observations.csv");
  if (fs.existsSync(obsPath)) {
    console.log("🌤️  Chargement des observations...");
    const rows = parseCSV(fs.readFileSync(obsPath, "utf-8"));
    const observations = rows.map((r) => ({
      _id: new mongoose.Types.ObjectId(r._id),
      location: r.location,
      proximity: r.proximity,
      vibe: r.vibe,
      notes: r.notes || "",
      timestamp: new Date(r.timestamp),
      deviceId: r.deviceId ? new mongoose.Types.ObjectId(r.deviceId) : null,
    }));
    await Observation.insertMany(observations);
    console.log(`   ✅ ${observations.length} observations chargées\n`);
  }

  console.log("✅ Rechargement terminé. La base est prête.");
  await mongoose.disconnect();
  process.exit(0);
}

loadFromCSV().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
