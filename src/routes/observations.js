// src/routes/observations.js
import { Router } from "express";
import Observation from "../models/Observation.js";
import { requireApiKey } from "../middlewares/auth.js";
import { requireUser } from "../middlewares/requireUser.js";

const router = Router();

// POST /observations — Soumettre via device (Phase 1, inchangé)
router.post("/", requireApiKey, async (req, res) => {
  const { location, proximity, vibe, notes, timestamp } = req.body;

  if (!location || !proximity || !vibe || !timestamp) {
    return res.status(400).json({
      error: {
        code: "MISSING_FIELDS",
        message:
          "Les champs 'location', 'proximity', 'vibe' et 'timestamp' sont requis.",
        received: Object.keys(req.body),
      },
    });
  }

  try {
    const observation = await Observation.create({
      location,
      proximity,
      vibe,
      notes: notes ?? "",
      timestamp: new Date(timestamp),
      deviceId: req.device._id,
    });

    res.status(201).json({ data: observation });
  } catch (err) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: err.message },
    });
  }
});

// POST /observations/user — Soumettre via utilisateur connecté (Phase 2)
router.post("/user", requireUser, async (req, res) => {
  const { location, proximity, vibe, notes } = req.body;

  if (!location || !proximity || !vibe) {
    return res.status(400).json({
      error: {
        code: "MISSING_FIELDS",
        message: "Les champs 'location', 'proximity' et 'vibe' sont requis.",
        received: Object.keys(req.body),
      },
    });
  }

  try {
    const observation = await Observation.create({
      location,
      proximity,
      vibe,
      notes: notes ?? "",
      timestamp: new Date(),
      userId: req.user._id,
    });

    res.status(201).json({ data: observation });
  } catch (err) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: err.message },
    });
  }
});

// GET /observations — Lister les observations (public, inchangé)
router.get("/", async (req, res) => {
  const { location, vibe, since, until, limit } = req.query;
  const filtre = {};

  if (location) filtre.location = location.toLowerCase();
  if (vibe) filtre.vibe = vibe;

  if (since || until) {
    filtre.timestamp = {};
    if (since) filtre.timestamp.$gte = new Date(since);
    if (until) filtre.timestamp.$lte = new Date(until);
  }

  const maxDocs = Math.min(Number(limit) || 100, 500);
  const observations = await Observation.find(filtre)
    .sort({ timestamp: -1 })
    .limit(maxDocs);

  res.json({ data: observations, meta: { count: observations.length } });
});

// GET /observations/mine — Mes observations (protégé)
router.get("/mine", requireUser, async (req, res) => {
  const observations = await Observation.find({ userId: req.user._id })
    .sort({ timestamp: -1 });

  res.json({ data: observations, meta: { count: observations.length } });
});

export default router;