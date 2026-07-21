// src/routes/users.js
import { Router } from "express";
import { requireUser } from "../middlewares/requireUser.js";
import Observation from "../models/Observation.js";

const router = Router();

// GET /users/me — Mon profil
router.get("/me", requireUser, async (req, res) => {
  res.json({
    data: {
      id: req.user._id,
      email: req.user.email,
      username: req.user.username,
      favorites: req.user.favorites,
      createdAt: req.user.createdAt,
    },
  });
});

// GET /users/me/locations — Mes lieux (où j'ai soumis des observations)
router.get("/me/locations", requireUser, async (req, res) => {
  const locations = await Observation.distinct("location", {
    userId: req.user._id,
  });

  res.json({ data: locations, meta: { count: locations.length } });
});

// GET /users/me/stats — Récapitulatif de mes contributions
router.get("/me/stats", requireUser, async (req, res) => {
  const totalObservations = await Observation.countDocuments({
    userId: req.user._id,
  });

  const byLocation = await Observation.aggregate([
    { $match: { userId: req.user._id } },
    { $group: { _id: "$location", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    data: {
      totalObservations,
      byLocation: byLocation.map((l) => ({
        location: l._id,
        count: l.count,
      })),
    },
  });
});

// POST /users/me/favorites — Ajouter un lieu en favori
router.post("/me/favorites", requireUser, async (req, res) => {
  const { location } = req.body;

  if (!location) {
    return res.status(400).json({
      error: {
        code: "MISSING_FIELDS",
        message: "Le champ 'location' est requis.",
      },
    });
  }

  const slug = location.toLowerCase();

  if (req.user.favorites.includes(slug)) {
    return res.status(409).json({
      error: {
        code: "ALREADY_FAVORITE",
        message: `'${slug}' est déjà dans vos favoris.`,
      },
    });
  }

  req.user.favorites.push(slug);
  await req.user.save();

  res.json({ data: { favorites: req.user.favorites } });
});

// DELETE /users/me/favorites/:location — Retirer un favori
router.delete("/me/favorites/:location", requireUser, async (req, res) => {
  const slug = req.params.location.toLowerCase();

  req.user.favorites = req.user.favorites.filter((f) => f !== slug);
  await req.user.save();

  res.json({ data: { favorites: req.user.favorites } });
});

export default router;