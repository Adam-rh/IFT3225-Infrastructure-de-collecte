// src/routes/locations.js
import { Router } from "express";
import Location from "../models/Location.js";

const router = Router();

// GET /locations — Lister tous les lieux
router.get("/", async (req, res) => {
  const locations = await Location.find();
  res.json({ data: locations, meta: { count: locations.length } });
});

// GET /locations/:name — Un lieu par son slug
router.get("/:name", async (req, res) => {
  const name = req.params.name.toLowerCase();
  const location = await Location.findOne({ name });

  if (!location) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Aucun lieu trouvé avec le nom '${name}'.`,
      },
    });
  }

  res.json({ data: location });
});

// POST /locations — Créer un lieu
router.post("/", async (req, res) => {
  const { name, label, latitude, longitude } = req.body;

  if (!name || !label || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      error: {
        code: "MISSING_FIELDS",
        message: "Les champs 'name', 'label', 'latitude' et 'longitude' sont requis.",
        received: Object.keys(req.body),
      },
    });
  }

  try {
    const location = await Location.create({ name, label, latitude, longitude });
    res.status(201).json({ data: location });
  } catch (err) {
    res.status(400).json({
      error: { code: "CREATION_FAILED", message: err.message },
    });
  }
});

export default router;