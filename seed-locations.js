// seed-locations.js
import dotenv from "dotenv";
dotenv.config();

import { connecterDB } from "./src/db.js";
import Location from "./src/models/Location.js";

const locations = [
  {
    name: "epicerie-iga",
    label: "Épicerie IGA",
    latitude: 45.5320,
    longitude: -73.6145,
  },
  {
    name: "auberge-gaspesie",
    label: "Auberge Gaspésie",
    latitude: 48.8360,
    longitude: -64.4893,
  },
  {
    name: "perce-bord-de-mer",
    label: "Percé, bord de mer",
    latitude: 48.5244,
    longitude: -64.2127,
  },
];

await connecterDB();

try {
  for (const loc of locations) {
    await Location.updateOne(
      { name: loc.name },
      { $set: loc },
      { upsert: true }
    );
    console.log(`✓ ${loc.label} (${loc.latitude}, ${loc.longitude})`);
  }
  console.log("\nTous les lieux ont été insérés.");
  process.exit(0);
} catch (err) {
  console.error("Erreur:", err.message);
  process.exit(1);
}