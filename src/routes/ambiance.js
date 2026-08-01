// src/routes/ambiance.js — couche mince : req/res uniquement
import { Router } from "express";
import * as mesuresRepo from "../repositories/measurements.js";
import * as obsRepo from "../repositories/observations.js";
import {
  calculerSnapshot,
  grouperParHeure,
  grouperParTranche,
  calculerStats,
} from "../services/ambiance.js";

const router = Router();

function parseDuration(str) {
  const match = str.match(/^(\d+)(m|h|d)$/);
  if (!match) return null;
  const [, n, unit] = match;
  const multipliers = { m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(n) * multipliers[unit];
}

router.get("/:location/now", async (req, res) => {
  const location = req.params.location.toLowerCase();
  const depuis = new Date(Date.now() - 30 * 60 * 1000);
  const mesures = await mesuresRepo.findDepuis(location, depuis);
  const derniereObs = await obsRepo.findDerniere(location);

  if (mesures.length === 0 && !derniereObs) {
    return res.status(404).json({
      error: { code: "NO_DATA", message: `Aucune donnée récente pour le lieu '${location}'.` },
    });
  }

  res.json({
    data: {
      location,
      snapshot: calculerSnapshot(mesures),
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

router.get("/:location/history", async (req, res) => {
  const location = req.params.location.toLowerCase();
  const last = req.query.last || "3h";
  const durationMs = parseDuration(last);

  if (!durationMs) {
    return res.status(400).json({
      error: { code: "INVALID_DURATION", message: "Format attendu : 30m, 1h, 3h, 6h, 12h, 24h, 7d" },
    });
  }

  const mesures = await mesuresRepo.findDepuis(location, new Date(Date.now() - durationMs));
  const timeline = grouperParTranche(mesures);

  res.json({
    data: { location, period: last, timeline },
    meta: { bucketSize: "15m", bucketCount: timeline.length },
  });
});

router.get("/:location/quiet-hours", async (req, res) => {
  const location = req.params.location.toLowerCase();
  const mesures = await mesuresRepo.findParLieu(location);

  if (mesures.length === 0) {
    return res.status(404).json({
      error: { code: "NO_DATA", message: `Aucune mesure pour le lieu '${location}'.` },
    });
  }

  const resultat = grouperParHeure(mesures);
  res.json({
    data: { location, ...resultat },
    meta: { totalHoursWithData: resultat.allHours.length },
  });
});

router.get("/:location/stats", async (req, res) => {
  const location = req.params.location.toLowerCase();
  const mesures = await mesuresRepo.findParLieu(location);
  const observations = await obsRepo.findParLieu(location);

  if (mesures.length === 0 && observations.length === 0) {
    return res.status(404).json({
      error: { code: "NO_DATA", message: `Aucune donnée pour le lieu '${location}'.` },
    });
  }

  res.json({
    data: { location, ...calculerStats(mesures, observations) },
    generatedAt: new Date(),
  });
});

router.get("/:location/stream", async (req, res) => {
  const location = req.params.location.toLowerCase();

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  let actif = true;

  async function pousser() {
    if (!actif) return;
    try {
      const mesures = await mesuresRepo.findDepuis(location, new Date(Date.now() - 30 * 60 * 1000));
      res.write(`data: ${JSON.stringify(calculerSnapshot(mesures))}\n\n`);
    } catch {
      res.write(`event: erreur\ndata: {"code":"SNAPSHOT_FAILED"}\n\n`);
    }
  }

  await pousser();
  const tic = setInterval(pousser, 15_000);
  const ping = setInterval(() => actif && res.write(": ping\n\n"), 25_000);

  req.on("close", () => {
    actif = false;
    clearInterval(tic);
    clearInterval(ping);
    res.end();
  });
});

export default router;
