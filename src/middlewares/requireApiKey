// src/middlewares/requireUser.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "ambiance-secret-dev";

export async function requireUser(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      error: {
        code: "MISSING_TOKEN",
        message: "En-tête Authorization requis (Bearer <token>).",
      },
    });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select("-password");

    if (!user) {
      return res.status(401).json({
        error: { code: "USER_NOT_FOUND", message: "Utilisateur introuvable." },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: "INVALID_TOKEN", message: "Token invalide ou expiré." },
    });
  }
}