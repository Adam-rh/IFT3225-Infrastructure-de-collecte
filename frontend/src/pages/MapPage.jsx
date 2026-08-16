import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useAuth } from "../context/AuthContext";
import { useLieuxAmbiance } from "../hooks/useLieuxAmbiance";
import { useFavorites } from "../hooks/useFavorites";
import { COLORS, SEUIL_FRAICHEUR, couleurNiveau, niveauHumain } from "../lib/ambiance";
import "leaflet/dist/leaflet.css";

function createIcon(classification, fresh, isFav) {
  const color = couleurNiveau(classification);
  const size = isFav ? 28 : 22;
  const ring = isFav
    ? "border: 3px solid #f1c40f; box-shadow: 0 0 8px rgba(241,196,15,0.6), 0 2px 6px rgba(0,0,0,0.3);"
    : "border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);";

  return L.divIcon({
    className: "",
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      ${ring}
      border-radius: 50%;
      opacity: ${fresh ? 1 : 0.5};
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 12, { duration: 1 });
  }, [coords, map]);
  return null;
}

export default function MapPage() {
  const { lieux, loading, error } = useLieuxAmbiance();
  const { favoris, estFavori, basculer } = useFavorites();
  const [flyTarget, setFlyTarget] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const favLieux = lieux.filter((l) => favoris.includes(l.name));

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <div className="skeleton" style={{ width: 200, height: 24, margin: "0 auto 1rem" }} />
        <div className="skeleton" style={{ width: "100%", height: "60vh" }} />
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>{error}</div>;
  }

  if (lieux.length === 0) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Aucun lieu disponible.</div>;
  }

  return (
    <div>
      <div style={{ padding: "1rem 2rem" }}>
        <h1>Carte des ambiances</h1>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          {Object.entries(COLORS).map(([label, color]) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.9rem" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: color, display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>

        <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.5rem" }}>
          Seuil de fraîcheur : {SEUIL_FRAICHEUR}. Les marqueurs semi-transparents indiquent des données plus anciennes.
        </p>

        {user && favLieux.length > 0 && (
          <div style={{ marginBottom: "0.5rem" }}>
            <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "0.4rem" }}>Mes favoris</p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {favLieux.map((lieu) => (
                <button
                  key={lieu.name}
                  onClick={() => setFlyTarget([lieu.latitude, lieu.longitude])}
                  aria-label={`Centrer la carte sur ${lieu.label}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "20px",
                    border: "2px solid #f1c40f",
                    background: "white",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: couleurNiveau(lieu.classification),
                      display: "inline-block",
                    }}
                  />
                  {lieu.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <MapContainer center={[47.0, -68.0]} zoom={6} style={{ height: "70vh", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <FlyTo coords={flyTarget} />

        {lieux.map((lieu) => (
          <Marker
            key={lieu.name}
            position={[lieu.latitude, lieu.longitude]}
            icon={createIcon(lieu.classification, lieu.fresh, estFavori(lieu.name))}
          >
            <Popup>
              <strong>{lieu.label}</strong>
              <br />
              Classification :{" "}
              <strong style={{ color: couleurNiveau(lieu.classification) }}>{lieu.classification}</strong>
              <br />
              {lieu.avgAmplitude !== null && (
                <>
                  Niveau sonore : {lieu.avgAmplitude} ({niveauHumain(lieu.avgAmplitude)})
                  <br />
                </>
              )}
              {!lieu.fresh && (
                <span style={{ fontSize: "0.8rem", color: "#888", fontStyle: "italic" }}>
                  Données non récentes
                </span>
              )}
              <br />
              <button
                onClick={() => navigate(`/lieu/${lieu.name}`)}
                style={{
                  marginTop: "0.5rem",
                  padding: "0.3rem 0.8rem",
                  background: "#1a1a2e",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Voir le portrait
              </button>

              {user && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    basculer(lieu.name);
                  }}
                  aria-label={
                    estFavori(lieu.name)
                      ? `Retirer ${lieu.label} des favoris`
                      : `Ajouter ${lieu.label} aux favoris`
                  }
                  style={{
                    marginTop: "0.3rem",
                    padding: "0.3rem 0.8rem",
                    background: estFavori(lieu.name) ? "#fef9e7" : "transparent",
                    color: estFavori(lieu.name) ? "#d4ac0d" : "#888",
                    border: estFavori(lieu.name) ? "2px solid #f1c40f" : "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: estFavori(lieu.name) ? "bold" : "normal",
                  }}
                >
                  {estFavori(lieu.name) ? "★ Favori" : "☆ Ajouter aux favoris"}
                </button>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}