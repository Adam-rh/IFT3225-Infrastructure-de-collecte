// src/models/Location.js
import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Le champ 'name' est requis."],
    unique: true,
    trim: true,
    lowercase: true,
  },
  label: {
    type: String,
    required: [true, "Le champ 'label' est requis."],
    trim: true,
  },
  latitude: {
    type: Number,
    required: [true, "Le champ 'latitude' est requis."],
  },
  longitude: {
    type: Number,
    required: [true, "Le champ 'longitude' est requis."],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Location", locationSchema); 