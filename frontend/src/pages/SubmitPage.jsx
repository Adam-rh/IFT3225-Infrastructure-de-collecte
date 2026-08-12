import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { submitObservation } from "../api/auth";
import { getLocations } from "../api/locations";
import { invaliderLieu } from "../lib/cacheClient";

const PROXIMITES = [
  { valeur: "proche", libelle: "Proche" },
  { valeur: "moyen", libelle: "Moyen" },
  { valeur: "loin", libelle: "Loin" },
];

// Aligné sur src/config/seuils.js : la catégorie « bruyant » a été retirée
const VIBES = [
  { valeur: "calme", libelle: "Calme" },
  { valeur: "modéré", libelle: "Modéré" },
  { valeur: "animé", libelle: "Animé" },
];

const CHAMP = { width: "100%", padding: "0.5rem", marginTop: "0.3rem" };

export default function SubmitPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [location, setLocation] = useState("");
  const [proximity, setProximity] = useState("moyen");
  const [vibe, setVibe] = useState("modéré");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    let annule = false;

    getLocations()
      .then((res) => {
        if (annule) return;
        setLocations(res.data.data);
        if (res.data.data.length > 0) setLocation(res.data.data[0].name);
      })
      .catch(() => {
        if (!annule) setError("Impossible de charger la liste des lieux.");
      });

    return () => {
      annule = true;
    };
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setEnvoi(true);

    try {
      await submitObservation({ location, proximity, vibe, notes });

      // L'écriture périme les vues dérivées de ce lieu et le classement global
      invaliderLieu(location);

      setSuccess(true);
      setNotes("");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Erreur lors de la soumission.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "3rem auto", padding: "2rem" }}>
      <h1>Soumettre une observation</h1>

      {success && (
        <p role="status" style={{ color: "#27ae60" }}>
          Observation soumise avec succès.
        </p>
      )}
      {error && (
        <p role="alert" style={{ color: "#e74c3c" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="lieu">Lieu</label>
          <select
            id="lieu"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={CHAMP}
          >
            {locations.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="proximite">Proximité</label>
          <select
            id="proximite"
            value={proximity}
            onChange={(e) => setProximity(e.target.value)}
            style={CHAMP}
          >
            {PROXIMITES.map((p) => (
              <option key={p.valeur} value={p.valeur}>
                {p.libelle}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="vibe">Ambiance ressentie</label>
          <select
            id="vibe"
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            style={CHAMP}
          >
            {VIBES.map((v) => (
              <option key={v.valeur} value={v.valeur}>
                {v.libelle}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="notes">Notes (optionnel)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={CHAMP}
          />
        </div>

        <button
          type="submit"
          disabled={envoi || !location}
          style={{
            width: "100%",
            padding: "0.7rem",
            background: envoi || !location ? "#888" : "#1a1a2e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: envoi || !location ? "not-allowed" : "pointer",
            fontSize: "1rem",
          }}
        >
          {envoi ? "Envoi en cours…" : "Soumettre"}
        </button>
      </form>
    </div>
  );
}