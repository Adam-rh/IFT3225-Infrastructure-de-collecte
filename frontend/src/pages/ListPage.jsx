import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLocations } from "../api/locations";
import { getStats } from "../api/ambiance";

const BADGE_COLORS = {
  calme: "#2ecc71",
  modéré: "#f39c12",
  animé: "#e74c3c",
  inconnu: "#95a5a6",
};

function niveauHumain(db) {
  if (db === null) return "";
  if (db < 40) return "Très calme";
  if (db < 60) return "Modéré";
  if (db < 75) return "Élevé";
  return "Très élevé";
}

export default function ListPage() {
  const [lieux, setLieux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("tous");

  useEffect(() => {
    async function fetchData() {
      try {
        const locRes = await getLocations();
        const locations = locRes.data.data;

        const enriched = await Promise.all(
          locations.map(async (loc) => {
            try {
              const statsRes = await getStats(loc.name);
              return {
                ...loc,
                classification: statsRes.data.data.measurements.overallClassification,
                avgAmplitude: statsRes.data.data.measurements.avgAmplitude,
                total: statsRes.data.data.measurements.total,
              };
            } catch {
              return { ...loc, classification: "inconnu", avgAmplitude: null, total: 0 };
            }
          })
        );

        setLieux(enriched);
      } catch {
        console.error("Erreur chargement lieux");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = filter === "tous" ? lieux : lieux.filter((l) => l.classification === filter);

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 2rem" }}>
        <div className="skeleton" style={{ width: 200, height: 30, marginBottom: "1rem" }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ width: "100%", height: 100, marginBottom: "1rem" }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 2rem" }}>
      <h1>Lieux</h1>

      <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0", flexWrap: "wrap" }}>
        {["tous", "calme", "modéré", "animé"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              background: filter === f ? "#1a1a2e" : "#ddd",
              color: filter === f ? "white" : "#333",
              fontSize: "0.9rem",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "#888", marginTop: "1rem" }}>Aucun lieu avec cette classification.</p>
      ) : (
        filtered.map((lieu) => (
          <Link
            key={lieu.name}
            to={`/lieu/${lieu.name}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div style={{
              background: "white",
              borderRadius: "8px",
              padding: "1.2rem 1.5rem",
              marginBottom: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "transform 0.2s",
              cursor: "pointer",
            }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div>
                <h3 style={{ marginBottom: "0.3rem" }}>{lieu.label}</h3>
                <p style={{ color: "#888", fontSize: "0.85rem" }}>
                  {lieu.total} mesures · {lieu.avgAmplitude !== null ? `${lieu.avgAmplitude} — ${niveauHumain(lieu.avgAmplitude)}` : "Aucune donnée"}
                </p>
              </div>
              <span style={{
                padding: "0.4rem 1rem",
                borderRadius: "20px",
                background: BADGE_COLORS[lieu.classification],
                color: "white",
                fontWeight: "bold",
                fontSize: "0.9rem",
              }}>
                {lieu.classification}
              </span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}