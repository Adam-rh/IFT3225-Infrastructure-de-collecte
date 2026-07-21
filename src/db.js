// src/db.js — Connexion à MongoDB Atlas via Mongoose
import mongoose from "mongoose";

export async function connecterDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI manquant dans .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ Connecté à MongoDB Atlas");
  } catch (err) {
    console.error("❌ Échec de connexion MongoDB:", err.message);
    process.exit(1);
  }
}
