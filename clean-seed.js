// clean-seed.js — Supprime les données seed (cafe-olimpico, parc-laurier)
// pour ne garder QUE les 3 vraies sessions de collecte terrain.
//
// Usage : node clean-seed.js
//
// ⚠️  ATTENTION : ce script supprime des données. Pas réversible.
//     Il ne touche PAS aux lieux : epicerie-iga, auberge-gaspesie, perce-bord-de-mer

import "dotenv/config";
import mongoose from "mongoose";
import Measurement from "./src/models/Measurement.js";
import Observation from "./src/models/Observation.js";

// Lieux à supprimer (les données de démo du seed)
const SEED_LOCATIONS = ["cafe-olimpico", "parc-laurier"];

// Lieux à GARDER (tes vraies sessions terrain)
const KEEP_LOCATIONS = ["epicerie-iga", "auberge-gaspesie", "perce-bord-de-mer"];

async function cleanSeed() {
  console.log("🔌 Connexion à MongoDB Atlas...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connecté\n");

  // ─── Avant nettoyage : bilan ──────────────────────────────────
  console.log("📊 État actuel de la base :");
  for (const loc of [...SEED_LOCATIONS, ...KEEP_LOCATIONS]) {
    const count = await Measurement.countDocuments({ location: loc });
    const marker = SEED_LOCATIONS.includes(loc) ? "❌" : "✅";
    console.log(`   ${marker} ${loc}: ${count} mesures`);
  }
  console.log("");

  // ─── Suppression des mesures seed ─────────────────────────────
  console.log("🗑️  Suppression des mesures seed...");
  for (const loc of SEED_LOCATIONS) {
    const result = await Measurement.deleteMany({ location: loc });
    console.log(`   ✅ ${loc}: ${result.deletedCount} mesures supprimées`);
  }
  console.log("");

  // ─── Suppression des observations seed ────────────────────────
  console.log("🗑️  Suppression des observations seed...");
  for (const loc of SEED_LOCATIONS) {
    const result = await Observation.deleteMany({ location: loc });
    console.log(`   ✅ ${loc}: ${result.deletedCount} observations supprimées`);
  }
  console.log("");

  // ─── Après nettoyage : bilan ──────────────────────────────────
  console.log("📊 État final de la base :");
  const remainingLocations = await Measurement.distinct("location");
  for (const loc of remainingLocations) {
    const count = await Measurement.countDocuments({ location: loc });
    console.log(`   ✅ ${loc}: ${count} mesures`);
  }

  const totalMeasurements = await Measurement.countDocuments({});
  const totalObservations = await Observation.countDocuments({});
  console.log(
    `\n📦 Total final : ${totalMeasurements} mesures + ${totalObservations} observations`
  );

  console.log("\n✅ Nettoyage terminé. Base prête pour la correction.");
  await mongoose.disconnect();
  process.exit(0);
}

cleanSeed().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
