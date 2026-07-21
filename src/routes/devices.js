// src/routes/devices.js — Gestion des devices (capteurs enregistrés)
import { Router } from "express";
import Device from "../models/Device.js";

const router = Router();

// POST /devices — Enregistrer un nouveau device (NON protégé — vulnérabilité identifiée)
router.post("/", async (req, res) => {
  const { name, location } = req.body;

  if (!name || !location) {
    return res.status(400).json({
      error: {
        code: "MISSING_FIELDS",
        message: "Les champs 'name' et 'location' sont requis.",
        received: Object.keys(req.body),
      },
    });
  }

  try {
    const device = await Device.create({ name, location });
    res.status(201).json({
      data: {
        id: device._id,
        name: device.name,
        location: device.location,
        apiKey: device.apiKey,
        createdAt: device.createdAt,
      },
      message: "Device enregistré. Conservez la clé API — elle ne sera plus affichée.",
    });
  } catch (err) {
    res.status(400).json({
      error: { code: "CREATION_FAILED", message: err.message },
    });
  }
});

// GET /devices — Lister tous les devices (clé API masquée)
router.get("/", async (req, res) => {
  const devices = await Device.find({}, { apiKey: 0 }); // projection : exclure apiKey
  res.json({ data: devices, meta: { count: devices.length } });
});

export default router;
