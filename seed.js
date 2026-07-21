// seed.js — Peupler la base avec des données de démonstration
// Usage : npm run seed
import "dotenv/config";
import mongoose from "mongoose";
import { connecterDB } from "./src/db.js";
import Device from "./src/models/Device.js";
import Measurement from "./src/models/Measurement.js";
import Observation from "./src/models/Observation.js";

await connecterDB();

// ─── Nettoyage ───────────────────────────────────────────────────────
await Device.deleteMany({});
await Measurement.deleteMany({});
await Observation.deleteMany({});
console.log("🗑️  Collections vidées.");

// ─── Devices ─────────────────────────────────────────────────────────
const devices = await Device.insertMany([
  { name: "iPhone-bridge-1", location: "cafe-olimpico" },
  { name: "Pixel-bridge-2", location: "cafe-olimpico" },
  { name: "Samsung-parc", location: "parc-laurier" },
]);
console.log(`📱 ${devices.length} devices créés.`);
console.log(`   Clé API device 1 : ${devices[0].apiKey}`);

// ─── Helpers ─────────────────────────────────────────────────────────
function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Mesures d'amplitude ─────────────────────────────────────────────
// Simuler 3 sessions de collecte sur 7 jours, à des heures variées
const now = new Date();
const measurements = [];

const sessions = [
  { daysAgo: 6, startHour: 8, label: "matin" },      // session 1 : matin calme
  { daysAgo: 4, startHour: 12, label: "midi" },       // session 2 : heure de lunch
  { daysAgo: 2, startHour: 17, label: "apres-midi" }, // session 3 : fin d'après-midi
  { daysAgo: 1, startHour: 20, label: "soiree" },     // session 4 : soirée
  { daysAgo: 0, startHour: 10, label: "recente" },    // session 5 : récente
];

// Profils d'amplitude par moment de la journée (réaliste pour un café)
const profiles = {
  matin: { min: 30, max: 50 },         // calme
  midi: { min: 55, max: 75 },          // animé
  "apres-midi": { min: 45, max: 65 },  // modéré
  soiree: { min: 35, max: 55 },        // modéré-calme
  recente: { min: 40, max: 60 },       // modéré
};

for (const session of sessions) {
  const baseDate = new Date(now);
  baseDate.setDate(baseDate.getDate() - session.daysAgo);
  baseDate.setHours(session.startHour, 0, 0, 0);

  const profile = profiles[session.label];
  const durationMin = 20; // 20 minutes par session
  const intervalSec = 5;  // une mesure toutes les 5 secondes
  const count = (durationMin * 60) / intervalSec; // 240 mesures par session

  for (let i = 0; i < count; i++) {
    const ts = new Date(baseDate.getTime() + i * intervalSec * 1000);
    measurements.push({
      type: "amplitude",
      value: randomBetween(profile.min, profile.max),
      unit: "dB",
      location: "cafe-olimpico",
      deviceId: devices[0]._id,
      timestamp: ts,
      receivedAt: new Date(ts.getTime() + 200), // léger délai réseau
    });
  }
}

// Quelques mesures pour le 2e lieu (parc)
for (let i = 0; i < 120; i++) {
  const ts = new Date(now.getTime() - 3 * 86_400_000 + i * 10_000);
  measurements.push({
    type: "amplitude",
    value: randomBetween(25, 55), // parc = plus calme en général
    unit: "dB",
    location: "parc-laurier",
    deviceId: devices[2]._id,
    timestamp: ts,
    receivedAt: new Date(ts.getTime() + 150),
  });
}

await Measurement.insertMany(measurements);
console.log(`📊 ${measurements.length} mesures créées.`);

// ─── Observations environnementales ──────────────────────────────────
const vibes = ["calme", "modéré", "animé", "bruyant"];
const proximities = ["proche", "moyen", "loin"];

const observations = [];

const obsData = [
  { daysAgo: 6, hour: 8, vibe: "calme", proximity: "loin", notes: "Café quasi vide, musique douce en fond." },
  { daysAgo: 4, hour: 12, vibe: "animé", proximity: "proche", notes: "Heure du lunch, beaucoup de monde, conversations animées." },
  { daysAgo: 2, hour: 17, vibe: "modéré", proximity: "moyen", notes: "Quelques étudiants avec laptops, ambiance de travail." },
  { daysAgo: 1, hour: 20, vibe: "modéré", proximity: "moyen", notes: "Soirée tranquille, quelques couples." },
  { daysAgo: 0, hour: 10, vibe: "calme", proximity: "loin", notes: "Matin en semaine, peu de monde." },
  // Parc
  { daysAgo: 3, hour: 15, vibe: "animé", proximity: "proche", notes: "Enfants au parc, familles.", location: "parc-laurier" },
  { daysAgo: 3, hour: 15, vibe: "calme", proximity: "loin", notes: "Fin de journée, le parc se vide.", location: "parc-laurier" },
];

for (const obs of obsData) {
  const ts = new Date(now);
  ts.setDate(ts.getDate() - obs.daysAgo);
  ts.setHours(obs.hour, 0, 0, 0);

  observations.push({
    location: obs.location || "cafe-olimpico",
    proximity: obs.proximity,
    vibe: obs.vibe,
    notes: obs.notes,
    deviceId: devices[0]._id,
    timestamp: ts,
    receivedAt: ts,
  });
}

await Observation.insertMany(observations);
console.log(`🌤️  ${observations.length} observations créées.`);

// ─── Résumé ──────────────────────────────────────────────────────────
console.log("\n✅ Seed terminé. Résumé :");
console.log(`   Devices       : ${devices.length}`);
console.log(`   Mesures       : ${measurements.length}`);
console.log(`   Observations  : ${observations.length}`);
console.log(`   Lieux         : cafe-olimpico, parc-laurier`);
console.log(`\n🔑 Clé API pour tester :`);
console.log(`   ${devices[0].apiKey}`);

await mongoose.disconnect();
