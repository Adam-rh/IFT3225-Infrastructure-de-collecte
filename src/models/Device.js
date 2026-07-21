// src/models/Device.js
import mongoose from "mongoose";
import crypto from "crypto";

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Le champ 'name' est requis."],
    trim: true,
  },
  location: {
    type: String,
    required: [true, "Le champ 'location' est requis."],
    trim: true,
    lowercase: true,
  },
  apiKey: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(32).toString("hex"),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Device", deviceSchema);
