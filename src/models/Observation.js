// src/models/Observation.js
import mongoose from "mongoose";

const observationSchema = new mongoose.Schema({
  location: {
    type: String,
    required: [true, "Le champ 'location' est requis."],
    trim: true,
    lowercase: true,
  },
  proximity: {
    type: String,
    required: [true, "Le champ 'proximity' est requis."],
    enum: {
      values: ["proche", "moyen", "loin"],
      message: "Valeurs acceptées pour 'proximity' : proche, moyen, loin",
    },
  },
  vibe: {
    type: String,
    required: [true, "Le champ 'vibe' est requis."],
    enum: {
      // « bruyant » retiré de l'interface en phase 2 (retour du professeur) mais
      // conservé ici pour ne pas invalider d'anciennes observations en base.
      values: ["calme", "modéré", "animé", "bruyant"],
      message: "Valeurs acceptées pour 'vibe' : calme, modéré, animé, bruyant",
    },
  },
  notes: {
    type: String,
    trim: true,
    default: "",
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  timestamp: {
    type: Date,
    required: [true, "Le champ 'timestamp' est requis."],
  },
  receivedAt: {
    type: Date,
    default: Date.now,
  },
});

observationSchema.index({ location: 1, timestamp: -1 });

export default mongoose.model("Observation", observationSchema);