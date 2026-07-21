// index.js — Point d'entrée : charger .env, connecter la BD, démarrer le serveur
import "dotenv/config";
import app from "./src/app.js";
import { connecterDB } from "./src/db.js";

const PORT = process.env.PORT || 3000;

await connecterDB();

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
