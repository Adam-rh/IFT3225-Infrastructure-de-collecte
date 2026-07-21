import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { submitObservation } from "../api/auth";
import { getLocations } from "../api/locations";

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

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    getLocations().then((res) => {
      setLocations(res.data.data);
      if (res.data.data.length > 0) setLocation(res.data.data[0].name);
    });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await submitObservation({ location, proximity, vibe, notes });
      setSuccess(true);
      setNotes("");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Erreur lors de la soumission.");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "3rem auto", padding: "2rem" }}>
      <h1>Soumettre une observation</h1>
      {success && <p style={{ color: "green" }}>Observation soumise avec succès!</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Lieu</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.3rem" }}
          >
            {locations.map((loc) => (
              <option key={loc.name} value={loc.name}>{loc.label}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Proximité</label>
          <select
            value={proximity}
            onChange={(e) => setProximity(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.3rem" }}
          >
            <option value="proche">Proche</option>
            <option value="moyen">Moyen</option>
            <option value="loin">Loin</option>
          </select>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Vibe</label>
          <select
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.3rem" }}
          >
            <option value="calme">Calme</option>
            <option value="modéré">Modéré</option>
            <option value="animé">Animé</option>
            <option value="bruyant">Bruyant</option>
          </select>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Notes (optionnel)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.3rem" }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "0.7rem",
            background: "#1a1a2e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Soumettre
        </button>
      </form>
    </div>
  );
}