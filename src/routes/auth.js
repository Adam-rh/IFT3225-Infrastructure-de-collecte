// src/routes/auth.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "ambiance-secret-dev";

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
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
        },
        token,
      },
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
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Email ou mot de passe incorrect.",
      },
    });
  }

  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    data: {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      token,
    },
  });
});

export default router;