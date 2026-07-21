// export-data.js — Exporte les données MongoDB en fichiers CSV
//
// Usage :
//   node export-data.js
//
// Sortie : dossier data-backup/ avec :
//   - devices.csv
//   - measurements-epicerie-iga.csv
//   - measurements-auberge-gaspesie.csv
//   - measurements-perce-bord-de-mer.csv
//   - observations.csv

import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Device from "./src/models/Device.js";
import Measurement from "./src/models/Measurement.js";
import Observation from "./src/models/Observation.js";

const OUTPUT_DIR = "./data-backup";

// Crée le dossier de sortie s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Convertit un tableau d'objets en CSV
function toCSV(rows, columns) {
  if (rows.length === 0) return columns.join(",") + "\n";

  const header = columns.join(",");
  const data = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return "";
        if (val instanceof Date) return val.toISOString();
        const str = String(val);
        // Échappe les virgules et guillemets
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
  );

  return header + "\n" + data.join("\n") + "\n";
}

async function exportData() {
  console.log("🔌 Connexion à MongoDB Atlas...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connecté\n");

  // ─── Devices ─────────────────────────────────────────────────
  console.log("📱 Export des devices...");
  const devices = await Device.find({}).lean();
  const devicesCSV = toCSV(
    devices.map((d) => ({
      _id: d._id.toString(),
      name: d.name,
      location: d.location,
      apiKey: d.apiKey,
      createdAt: d.createdAt,
    })),
    ["_id", "name", "location", "apiKey", "createdAt"]
  );
  fs.writeFileSync(path.join(OUTPUT_DIR, "devices.csv"), devicesCSV);
  console.log(`   ✅ ${devices.length} devices exportés vers devices.csv\n`);

  // ─── Measurements par lieu ───────────────────────────────────
  const locations = await Measurement.distinct("location");
  console.log(`📊 ${locations.length} lieux trouvés : ${locations.join(", ")}\n`);

  for (const location of locations) {
    const measurements = await Measurement.find({ location })
      .sort({ timestamp: 1 })
      .lean();
    const csv = toCSV(
      measurements.map((m) => ({
        _id: m._id.toString(),
        type: m.type,
        value: m.value,
        unit: m.unit,
        location: m.location,
        deviceId: m.deviceId ? m.deviceId.toString() : "",
        timestamp: m.timestamp,
        receivedAt: m.receivedAt,
      })),
      ["_id", "type", "value", "unit", "location", "deviceId", "timestamp", "receivedAt"]
    );
    const filename = `measurements-${location}.csv`;
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), csv);
    console.log(`   ✅ ${measurements.length} mesures → ${filename}`);
  }

  // ─── Observations ────────────────────────────────────────────
  console.log("\n🌤️  Export des observations...");
  const observations = await Observation.find({}).sort({ timestamp: 1 }).lean();
  const obsCSV = toCSV(
    observations.map((o) => ({
      _id: o._id.toString(),
      location: o.location,
      proximity: o.proximity,
      vibe: o.vibe,
      notes: o.notes || "",
      timestamp: o.timestamp,
      deviceId: o.deviceId ? o.deviceId.toString() : "",
    })),
    ["_id", "location", "proximity", "vibe", "notes", "timestamp", "deviceId"]
  );
  fs.writeFileSync(path.join(OUTPUT_DIR, "observations.csv"), obsCSV);
  console.log(`   ✅ ${observations.length} observations exportées vers observations.csv\n`);

  console.log(`📦 Export terminé dans le dossier ${OUTPUT_DIR}/`);
  await mongoose.disconnect();
  process.exit(0);
}

exportData().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
