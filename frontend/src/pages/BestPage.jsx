import { useState } from "react";
import { Link } from "react-router-dom";
import { useBest } from "../hooks/useBest";
import { niveauHumain } from "../lib/ambiance";
import NiveauBadge from "../components/NiveauBadge";
import EtatChargement from "../components/EtatChargement";
import EtatErreur from "../components/EtatErreur";

const LIBELLE_CONFIANCE = {
  bonne: "confiance bonne",
  moyenne: "confiance moyenne",
  faible: "confiance faible",
  aucune: "aucune donnée",
};

const COULEUR_CONFIANCE = {
  bonne: "#2ecc71",
  moyenne: "#f39c12",
  faible: "#e67e22",
  aucune: "#95a5a6",
};

function boutonFiltre(actif) {
  return {
    padding: "0.4rem 1rem",
    borderRadius: "20px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    background: actif ? "#1a1a2e" : "#ddd",
    color: actif ? "white" : "#333",
  };
}

export default function BestPage() {
  const maintenant = new Date().getHours();
  const [heure, setHeure] = useState(null);
  const { classement, recommandation, meta, loading, error } = useBest(heure);

  if (loading) return <EtatChargement lignes={3} hauteur={90} largeurTitre={260} />;
  if (error) return <EtatErreur message={error} />;

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 2rem" }}>
      <h1>Où aller maintenant ?</h1>
      <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "1rem" }}>
        Les lieux classés du plus calme au plus animé.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button onClick={() => setHeure(null)} aria-pressed={heure === null} style={boutonFiltre(heure === null)}>
          Tout l'historique
        </button>
        <button
          onClick={() => setHeure(maintenant)}
          aria-pressed={heure === maintenant}
          style={boutonFiltre(heure === maintenant)}
        >
          À cette heure-ci ({String(maintenant).padStart(2, "0")} h)
        </button>
      </div>

      {recommandation && (
        <div
          style={{
            background: "white",
            borderRadius: "8px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            borderLeft: "6px solid #f39c12",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.3rem" }}>Suggestion</p>
          <h2 style={{ marginBottom: "0.3rem" }}>{recommandation.label}</h2>
          <p style={{ color: "#555" }}>
            {recommandation.avgAmplitude} dB — {niveauHumain(recommandation.avgAmplitude)},{" "}
            {recommandation.sampleCount} mesure(s)
          </p>
          {recommandation.confiance !== "bonne" && (
            <p
              style={{
                fontSize: "0.8rem",
                color: COULEUR_CONFIANCE[recommandation.confiance],
                marginTop: "0.4rem",
              }}
            >
              Basé sur peu de mesures — à prendre avec prudence.
            </p>
          )}
        </div>
      )}

      {classement.map((lieu, index) => (
        <Link key={lieu.location} to={`/lieu/${lieu.location}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "1rem 1.5rem",
              marginBottom: "0.8rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              opacity: lieu.sampleCount === 0 ? 0.55 : 1,
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#bbb", minWidth: 24 }}>
              {index + 1}
            </span>

            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: "0.2rem" }}>{lieu.label}</h3>
              <p style={{ color: "#888", fontSize: "0.85rem" }}>
                {lieu.avgAmplitude !== null
                  ? `${lieu.avgAmplitude} dB — ${niveauHumain(lieu.avgAmplitude)}`
                  : "Aucune mesure sur cette période"}
                {" · "}
                <span style={{ color: COULEUR_CONFIANCE[lieu.confiance] }}>
                  {LIBELLE_CONFIANCE[lieu.confiance]}
                </span>
              </p>
            </div>

            <NiveauBadge classification={lieu.classification} />
          </div>
        </Link>
      ))}

      {meta && (
        <p style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "1rem" }}>
          {meta.lieuxAvecDonnees} lieu(x) avec données sur {meta.totalLieux}.
        </p>
      )}
    </div>
  );
}