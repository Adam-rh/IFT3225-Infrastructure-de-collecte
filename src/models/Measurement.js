// src/models/Measurement.js
import mongoose from "mongoose";

const measurementSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, "Le champ 'type' est requis."],
    enum: {
      values: ["amplitude"],
      message: "Type invalide. Valeurs acceptées : amplitude",
    },
  },
  value: {
    type: Number,
    required: [true, "Le champ 'value' est requis."],
  },
  unit: {
    type: String,
    default: "dB",
  },
  location: {
    type: String,
    required: [true, "Le champ 'location' est requis."],
    trim: true,
    lowercase: true,
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
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

// Index pour les requêtes fréquentes
measurementSchema.index({ location: 1, timestamp: -1 });
measurementSchema.index({ location: 1, type: 1 });

export default mongoose.model("Measurement", measurementSchema);
