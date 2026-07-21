// src/routes/measurements.js — Collecte et consultation des mesures capteurs
import { Router } from "express";
import Measurement from "../models/Measurement.js";
import { requireApiKey } from "../middlewares/auth.js";

const router = Router();

// POST /measurements — Soumettre une mesure (protégé par clé API)
router.post("/", requireApiKey, async (req, res) => {
  const { type, value, location, timestamp, unit } = req.body;

  if (!type || value === undefined || !location || !timestamp) {
    return res.status(400).json({
      error: {
        code: "MISSING_FIELDS",
        message:
          "Les champs 'type', 'value', 'location' et 'timestamp' sont requis.",
        received: Object.keys(req.body),
      },
    });
  }

  try {
    const measurement = await Measurement.create({
      type,
      value,
      unit: unit ?? "dB",
      location,
      timestamp: new Date(timestamp),
      deviceId: req.device._id,
    });

    res.status(201).json({ data: measurement });
  } catch (err) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: err.message },
    });
  }
});

// POST /measurements/batch — Soumettre un lot de mesures (protégé)
router.post("/batch", requireApiKey, async (req, res) => {
  const { measurements } = req.body;

  if (!Array.isArray(measurements) || measurements.length === 0) {
    return res.status(400).json({
      error: {
        code: "INVALID_BATCH",
        message: "Le corps doit contenir un tableau 'measurements' non vide.",
      },
    });
  }

  try {
    const docs = measurements.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
      deviceId: req.device._id,
    }));

    const inserted = await Measurement.insertMany(docs, { ordered: false });
    res.status(201).json({
      data: inserted,
      meta: { count: inserted.length },
    });
  } catch (err) {
    res.status(400).json({
      error: { code: "BATCH_ERROR", message: err.message },
    });
  }
});

// GET /measurements — Lister les mesures (avec filtres optionnels)
router.get("/", async (req, res) => {
  const { location, type, since, until, limit } = req.query;
  const filtre = {};

  if (location) filtre.location = location.toLowerCase();
  if (type) filtre.type = type;

  // Filtre temporel
  if (since || until) {
    filtre.timestamp = {};
    if (since) filtre.timestamp.$gte = new Date(since);
    if (until) filtre.timestamp.$lte = new Date(until);
  }

  const maxDocs = Math.min(Number(limit) || 100, 500);
  const measurements = await Measurement.find(filtre)
    .sort({ timestamp: -1 })
    .limit(maxDocs);

  res.json({ data: measurements, meta: { count: measurements.length } });
});

export default router;
