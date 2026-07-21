// src/middlewares/auth.js — Vérification de la clé API sur les routes d'écriture
import Device from "../models/Device.js";

export async function requireApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  // 401 — en-tête absent
  if (!apiKey) {
    return res.status(401).json({
      error: {
        code: "MISSING_API_KEY",
        message: "L'en-tête x-api-key est requis pour les opérations d'écriture.",
      },
    });
  }

  // Vérifier que la clé correspond à un device enregistré
  const device = await Device.findOne({ apiKey });

  // 403 — clé invalide
  if (!device) {
    return res.status(403).json({
      error: {
        code: "INVALID_API_KEY",
        message: "Clé API invalide ou device non enregistré.",
      },
    });
  }

  // Attacher le device à la requête pour usage dans les routes
  req.device = device;
  next();
}
