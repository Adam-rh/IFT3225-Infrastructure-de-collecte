// src/routes/ambiance.js — Endpoints sémantiques (vues dérivées, agrégation)
// Ces endpoints ne stockent rien : ils agrègent les mesures et observations
// pour répondre à des questions concrètes sur l'ambiance d'un lieu.

import { Router } from "express";
import Measurement from "../models/Measurement.js";
import Observation from "../models/Observation.js";

const router = Router();

// ─── Helpers ────────────────────────────────────────────────────────

/** Classifier une amplitude moyenne en catégorie d'ambiance */
function classifierAmbiance(avgDb) {
  if (avgDb === null || avgDb === undefined) return "inconnu";
  if (avgDb < 40) return "calme";
  if (avgDb < 60) return "modéré";
  if (avgDb < 75) return "animé";
  return "bruyant";
}

/** Parser une durée textuelle (ex: "3h", "30m", "1d") en millisecondes */
function parseDuration(str) {
  const match = str.match(/^(\d+)(m|h|d)$/);
  if (!match) return null;
  const [, n, unit] = match;
  const multipliers = { m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(n) * multipliers[unit];
}

/** Nom du jour de la semaine (en français) */
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// ─── 1. GET /ambiance/:location/now ─────────────────────────────────
// Portrait instantané de l'ambiance (dernières 30 minutes)
router.get("/:location/now", async (req, res) => {
  const location = req.params.location.toLowerCase();
  const fenetre = 30 * 60 * 1000; // 30 min
  const depuis = new Date(Date.now() - fenetre);

  // Mesures récentes
  const mesures = await Measurement.find({
    location,
    timestamp: { $gte: depuis },
  }).sort({ timestamp: -1 });

  // Dernière observation
  const derniereObs = await Observation.findOne({ location }).sort({
    timestamp: -1,
  });

  if (mesures.length === 0 && !derniereObs) {
    return res.status(404).json({
      error: {
        code: "NO_DATA",
        message: `Aucune donnée récente pour le lieu '${location}'.`,
      },
    });
  }

  // Calcul de l'ambiance
  const avgAmplitude =
    mesures.length > 0
      ? mesures.reduce((sum, m) => sum + m.value, 0) / mesures.length
      : null;

  const minAmplitude = mesures.length > 0 ? Math.min(...mesures.map((m) => m.value)) : null;
  const maxAmplitude = mesures.length > 0 ? Math.max(...mesures.map((m) => m.value)) : null;

  res.json({
    data: {
      location,
      snapshot: {
        classification: classifierAmbiance(avgAmplitude),
        avgAmplitude: avgAmplitude !== null ? Math.round(avgAmplitude * 100) / 100 : null,
        minAmplitude,
        maxAmplitude,
        measurementCount: mesures.length,
        window: "30m",
      },
      latestObservation: derniereObs
        ? {
            vibe: derniereObs.vibe,
            proximity: derniereObs.proximity,
            notes: derniereObs.notes,
            timestamp: derniereObs.timestamp,
          }
        : null,
      generatedAt: new Date(),
    },
  });
});

// ─── 2. GET /ambiance/:location/history?last=3h ─────────────────────
// Évolution de l'ambiance par tranches de 15 minutes
router.get("/:location/history", async (req, res) => {
  const location = req.params.location.toLowerCase();
  const last = req.query.last || "3h";
  const durationMs = parseDuration(last);

  if (!durationMs) {
    return res.status(400).json({
      error: {
        code: "INVALID_DURATION",
        message: "Format attendu : 30m, 1h, 3h, 6h, 12h, 24h, 7d",
      },
    });
  }

  const depuis = new Date(Date.now() - durationMs);
  const intervalMs = 15 * 60 * 1000; // tranches de 15 min

  // Agrégation MongoDB : grouper par tranche de 15 min
  const buckets = await Measurement.aggregate([
    { $match: { location, timestamp: { $gte: depuis } } },
    {
      $group: {
        _id: {
          $toDate: {
            $subtract: [
              { $toLong: "$timestamp" },
              { $mod: [{ $toLong: "$timestamp" }, intervalMs] },
            ],
          },
        },
        avgValue: { $avg: "$value" },
        minValue: { $min: "$value" },
        maxValue: { $max: "$value" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Enrichir avec la classification
  const timeline = buckets.map((b) => ({
    window: b._id,
    avgAmplitude: Math.round(b.avgValue * 100) / 100,
    minAmplitude: b.minValue,
    maxAmplitude: b.maxValue,
    classification: classifierAmbiance(b.avgValue),
    measurementCount: b.count,
  }));

  res.json({
    data: { location, period: last, timeline },
    meta: { bucketSize: "15m", bucketCount: timeline.length },
  });
});

// ─── 3. GET /ambiance/:location/quiet-hours ──────────────────────────
// Créneaux typiquement calmes (agrégation par heure de la journée)
router.get("/:location/quiet-hours", async (req, res) => {
  const location = req.params.location.toLowerCase();

  const parHeure = await Measurement.aggregate([
    { $match: { location } },
    {
      $group: {
        _id: { $hour: "$timestamp" },
        avgAmplitude: { $avg: "$value" },
        count: { $sum: 1 },
      },
    },
    { $sort: { avgAmplitude: 1 } }, // du plus calme au plus bruyant
  ]);

  if (parHeure.length === 0) {
    return res.status(404).json({
      error: {
        code: "NO_DATA",
        message: `Aucune mesure pour le lieu '${location}'.`,
      },
    });
  }

  const hours = parHeure.map((h) => ({
    hour: h._id,
    label: `${String(h._id).padStart(2, "0")}:00 – ${String(h._id + 1).padStart(2, "0")}:00`,
    avgAmplitude: Math.round(h.avgAmplitude * 100) / 100,
    classification: classifierAmbiance(h.avgAmplitude),
    sampleCount: h.count,
  }));

  res.json({
    data: {
      location,
      quietest: hours.slice(0, 3),
      loudest: hours.slice(-3).reverse(),
      allHours: hours,
    },
    meta: { totalHoursWithData: hours.length },
  });
});

// ─── 4. GET /ambiance/:location/stats ────────────────────────────────
// Statistiques globales du lieu (résumé complet)
router.get("/:location/stats", async (req, res) => {
  const location = req.params.location.toLowerCase();

  // Stats mesures
  const measureStats = await Measurement.aggregate([
    { $match: { location } },
    {
      $group: {
        _id: null,
        avgAmplitude: { $avg: "$value" },
        minAmplitude: { $min: "$value" },
        maxAmplitude: { $max: "$value" },
        totalMeasurements: { $sum: 1 },
        firstMeasurement: { $min: "$timestamp" },
        lastMeasurement: { $max: "$timestamp" },
      },
    },
  ]);

  // Stats observations — distribution des vibes
  const vibeDistribution = await Observation.aggregate([
    { $match: { location } },
    { $group: { _id: "$vibe", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Stats observations — distribution par jour de la semaine
  const parJour = await Measurement.aggregate([
    { $match: { location } },
    {
      $group: {
        _id: { $dayOfWeek: "$timestamp" }, // 1=dim, 2=lun, ..., 7=sam
        avgAmplitude: { $avg: "$value" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalObs = await Observation.countDocuments({ location });

  if (!measureStats.length && totalObs === 0) {
    return res.status(404).json({
      error: {
        code: "NO_DATA",
        message: `Aucune donnée pour le lieu '${location}'.`,
      },
    });
  }

  const stats = measureStats[0] || {};

  res.json({
    data: {
      location,
      measurements: {
        total: stats.totalMeasurements || 0,
        avgAmplitude: stats.avgAmplitude
          ? Math.round(stats.avgAmplitude * 100) / 100
          : null,
        minAmplitude: stats.minAmplitude ?? null,
        maxAmplitude: stats.maxAmplitude ?? null,
        overallClassification: classifierAmbiance(stats.avgAmplitude),
        firstRecord: stats.firstMeasurement || null,
        lastRecord: stats.lastMeasurement || null,
      },
      observations: {
        total: totalObs,
        vibeDistribution: vibeDistribution.map((v) => ({
          vibe: v._id,
          count: v.count,
        })),
      },
      byDayOfWeek: parJour.map((d) => ({
        day: JOURS[d._id - 1], // MongoDB $dayOfWeek : 1=dim
        avgAmplitude: Math.round(d.avgAmplitude * 100) / 100,
        classification: classifierAmbiance(d.avgAmplitude),
        sampleCount: d.count,
      })),
    },
    generatedAt: new Date(),
  });
});

export default router;
