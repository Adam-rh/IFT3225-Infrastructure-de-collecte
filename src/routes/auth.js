// src/routes/auth.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET, JWT_EXPIRATION } from "../config/jwt.js";

const router = Router();

function signerJeton(user) {
  return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
}

function profilPublic(user) {
  return { id: user._id, email: user.email, username: user.username };
}

// POST /auth/register — Créer un compte
router.post("/register", async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({
      error: {
        code: "MISSING_FIELDS",
        message: "Les champs 'email', 'username' et 'password' sont requis.",
        received: Object.keys(req.body),
      },
    });
  }

  try {
    const user = await User.create({ email, username, password });

    res.status(201).json({
      data: { user: profilPublic(user), token: signerJeton(user) },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: { code: "EMAIL_EXISTS", message: "Cet email est déjà utilisé." },
      });
    }
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: err.message },
    });
  }
});

// POST /auth/login — Se connecter
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: {
        code: "MISSING_FIELDS",
        message: "Les champs 'email' et 'password' sont requis.",
        received: Object.keys(req.body),
      },
    });
  }

  const user = await User.findOne({ email });

  // Même message et même code pour un email inconnu ou un mot de passe erroné :
  // distinguer les deux révélerait quels comptes existent.
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Email ou mot de passe incorrect.",
      },
    });
  }

  res.json({
    data: { user: profilPublic(user), token: signerJeton(user) },
  });
});

export default router;