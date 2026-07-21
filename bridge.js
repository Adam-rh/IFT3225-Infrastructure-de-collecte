// bridge.js — Bridge Phyphox → API
import "dotenv/config";

const {
  PHYPHOX_HOST = "http://192.168.1.100",
  BRIDGE_API_KEY,
  API_URL = "http://localhost:3000",
  BRIDGE_LOCATION = "cafe-olimpico",
  BRIDGE_INTERVAL = "5",
} = process.env;

if (!BRIDGE_API_KEY) {
  console.error("❌ BRIDGE_API_KEY manquant dans .env");
  process.exit(1);
}

const intervalMs = Number(BRIDGE_INTERVAL) * 1000;
let compteur = 0;
let errConsecutives = 0;
let bufferName = null;

console.log("🔊 Bridge Phyphox démarré");
console.log(`   Phyphox     : ${PHYPHOX_HOST}`);
console.log(`   API         : ${API_URL}`);
console.log(`   Lieu        : ${BRIDGE_LOCATION}`);
console.log(`   Intervalle  : ${BRIDGE_INTERVAL}s\n`);

async function detecterBuffer() {
  const candidats = ["dB", "dbUncal", "mean", "spl", "amp"];
  for (const nom of candidats) {
    try {
      const res = await fetch(`${PHYPHOX_HOST}/get?${nom}=full`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.buffer?.[nom]) {
        console.log(`✅ Buffer détecté : "${nom}"\n`);
        return nom;
      }
    } catch {}
  }
  return null;
}

async function collecte() {
  try {
    if (!bufferName) {
      bufferName = await detecterBuffer();
      if (!bufferName) {
        throw new Error("Aucun buffer reconnu. Appuyez sur Play ▶ dans Phyphox.");
      }
    }

    const phyRes = await fetch(`${PHYPHOX_HOST}/get?${bufferName}=full`);
    if (!phyRes.ok) throw new Error(`Phyphox HTTP ${phyRes.status}`);

    const phyData = await phyRes.json();
    const buf = phyData?.buffer?.[bufferName];
    const values = buf?.buffer || buf?.value || [];

    // Trouver la dernière valeur non-nulle dans le buffer
    let valeur = null;
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] !== 0 && values[i] !== null) {
        valeur = values[i];
        break;
      }
    }

    if (valeur === null) {
      console.warn("⚠️  Aucune valeur valide — en attente de données capteur...");
      return;
    }

    // Phyphox renvoie en dB FS (négatif). Conversion en dB SPL approximé.
    // Ex: -62.8 dB FS → 57.2 dB SPL
    if (valeur < 0) {
      valeur = 120 + valeur;
    }

    // Validation finale
    if (valeur < 0 || valeur > 130) {
      console.warn(`⚠️  Valeur hors plage: ${valeur.toFixed(1)} dB — ignorée`);
      return;
    }

    const payload = {
      type: "amplitude",
      value: Math.round(valeur * 100) / 100,
      unit: "dB",
      location: BRIDGE_LOCATION,
      timestamp: new Date().toISOString(),
    };

    const apiRes = await fetch(`${API_URL}/measurements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": BRIDGE_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!apiRes.ok) {
      const err = await apiRes.json().catch(() => ({}));
      throw new Error(`API ${apiRes.status}: ${err?.error?.message || "erreur"}`);
    }

    compteur++;
    errConsecutives = 0;
    process.stdout.write(
      `\r📡 Mesure #${compteur} | ${payload.value} dB | ${new Date().toLocaleTimeString()}      `
    );
  } catch (err) {
    errConsecutives++;
    console.error(`\n❌ Erreur: ${err.message}`);
    if (errConsecutives >= 10) {
      console.error("🛑 Trop d'erreurs — arrêt.");
      process.exit(1);
    }
  }
}

setInterval(collecte, intervalMs);
collecte();