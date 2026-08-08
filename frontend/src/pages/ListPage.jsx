import { useState } from "react";
import { Link } from "react-router-dom";
import { useLieuxAmbiance } from "../hooks/useLieuxAmbiance";
import { couleurNiveau, niveauHumain } from "../lib/ambiance";

const FILTRES = ["tous", "calme", "modéré", "animé"];

export default function ListPage() {
  const { lieux, loading, error } = useLieuxAmbiance({ tempsReel: false });
  const [filtre, setFiltre] = useState("tous");

  const filtres = filtre === "tous" ? lieux : lieux.filter((l) => l.classification === filtre);

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

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 2rem", color: "red" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 2rem" }}>
      <h1>Lieux</h1>

      <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0", flexWrap: "wrap" }}>
        {FILTRES.map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            aria-pressed={filtre === f}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              background: filtre === f ? "#1a1a2e" : "#ddd",
              color: filtre === f ? "white" : "#333",
              fontSize: "0.9rem",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtres.length === 0 ? (
        <p style={{ color: "#888", marginTop: "1rem" }}>Aucun lieu avec cette classification.</p>
      ) : (
        filtres.map((lieu) => (
          <Link
            key={lieu.name}
            to={`/lieu/${lieu.name}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
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
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div>
                <h3 style={{ marginBottom: "0.3rem" }}>{lieu.label}</h3>
                <p style={{ color: "#888", fontSize: "0.85rem" }}>
                  {lieu.total} mesures ·{" "}
                  {lieu.avgAmplitude !== null
                    ? `${lieu.avgAmplitude} — ${niveauHumain(lieu.avgAmplitude)}`
                    : "Aucune donnée"}
                </p>
              </div>
              <span
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "20px",
                  background: couleurNiveau(lieu.classification),
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                }}
              >
                {lieu.classification}
              </span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}