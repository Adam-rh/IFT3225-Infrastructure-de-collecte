// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Le champ 'email' est requis."],
    unique: true,
    trim: true,
    lowercase: true,
  },
  username: {
    type: String,
    required: [true, "Le champ 'username' est requis."],
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Le champ 'password' est requis."],
    minlength: [6, "Le mot de passe doit contenir au moins 6 caractères."],
  },
  favorites: [{
    type: String,
    lowercase: true,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash le mot de passe avant de sauvegarder
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidat) {
  return bcrypt.compare(candidat, this.password);
};

export default mongoose.model("User", userSchema);