import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { getLocations } from "../api/locations";
import { getNow, getStats } from "../api/ambiance";
import { useAuth } from "../context/AuthContext";
import { addFavorite, removeFavorite, getMe } from "../api/auth";
import "leaflet/dist/leaflet.css";

const COLORS = {
  calme: "#2ecc71",
  modéré: "#f39c12",
  animé: "#e74c3c",
  inconnu: "#95a5a6",
};

const SEUIL_FRAICHEUR = "48h";

function niveauHumain(db) {
  if (db === null) return "";
  if (db < 40) return "Très calme";
  if (db < 60) return "Modéré";
  if (db < 75) return "Élevé";
  return "Très élevé";
}

function createIcon(classification, fresh, isFav) {
  const color = COLORS[classification] || COLORS.inconnu;
  const opacity = fresh ? 1 : 0.5;
  const size = isFav ? 28 : 22;
  const ring = isFav ? `border: 3px solid #f1c40f; box-shadow: 0 0 8px rgba(241,196,15,0.6), 0 2px 6px rgba(0,0,0,0.3);` : `border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);`;
  return L.divIcon({
    className: "",
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      ${ring}
      border-radius: 50%;
      opacity: ${opacity};
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
  const [lieux, setLieux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [flyTarget, setFlyTarget] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      getMe().then((res) => setFavorites(res.data.data.favorites || []));
    } else {
      setFavorites([]);
    }
  }, [user]);

  const toggleFavorite = async (locationName) => {
    if (!user) return;
    try {
      if (favorites.includes(locationName)) {
        await removeFavorite(locationName);
        setFavorites(favorites.filter((f) => f !== locationName));
      } else {
        await addFavorite(locationName);
        setFavorites([...favorites, locationName]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const locRes = await getLocations();
        const locations = locRes.data.data;

        const enriched = await Promise.all(
          locations.map(async (loc) => {
            try {
              const ambRes = await getNow(loc.name);
              const classification = ambRes.data.data.snapshot.classification;
              if (classification === "inconnu" || !ambRes.data.data.snapshot.avgAmplitude) {
                throw new Error("no recent data");
              }
              return {
                ...loc,
                classification,
                avgAmplitude: ambRes.data.data.snapshot.avgAmplitude,
                fresh: true,
              };
            } catch {
              try {
                const statsRes = await getStats(loc.name);
                return {
                  ...loc,
                  classification: statsRes.data.data.measurements.overallClassification,
                  avgAmplitude: statsRes.data.data.measurements.avgAmplitude,
                  fresh: false,
                };
              } catch {
                return { ...loc, classification: "inconnu", avgAmplitude: null, fresh: false };
              }
            }
          })
        );

        setLieux(enriched);
      } catch {
        setError("Impossible de charger les lieux.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const favLieux = lieux.filter((l) => favorites.includes(l.name));

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <div className="skeleton" style={{ width: 200, height: 24, margin: "0 auto 1rem" }} />
        <div className="skeleton" style={{ width: "100%", height: "60vh" }} />
      </div>
    );
  }
  if (error) return <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>{error}</div>;
  if (lieux.length === 0) return <div style={{ padding: "2rem", textAlign: "center" }}>Aucun lieu disponible.</div>;

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
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <span style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: COLORS[lieu.classification],
                    display: "inline-block",
                  }} />
                  {lieu.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <MapContainer
        center={[47.0, -68.0]}
        zoom={6}
        style={{ height: "70vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <FlyTo coords={flyTarget} />
        {lieux.map((lieu) => (
          <Marker
            key={lieu.name}
            position={[lieu.latitude, lieu.longitude]}
            icon={createIcon(lieu.classification, lieu.fresh, favorites.includes(lieu.name))}
          >
            <Popup>
              <strong>{lieu.label}</strong>
              <br />
              Classification: <strong style={{ color: COLORS[lieu.classification] }}>{lieu.classification}</strong>
              <br />
              {lieu.avgAmplitude !== null && <>Niveau sonore: {lieu.avgAmplitude} ({niveauHumain(lieu.avgAmplitude)})<br /></>}
              {!lieu.fresh && (
                <span style={{ fontSize: "0.8rem", color: "#888", fontStyle: "italic" }}>Données non récentes</span>
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
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(lieu.name); }}
                  style={{
                    marginTop: "0.3rem",
                    padding: "0.3rem 0.8rem",
                    background: favorites.includes(lieu.name) ? "#fef9e7" : "transparent",
                    color: favorites.includes(lieu.name) ? "#d4ac0d" : "#888",
                    border: favorites.includes(lieu.name) ? "2px solid #f1c40f" : "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer",
                    width: "100%",
                    fontWeight: favorites.includes(lieu.name) ? "bold" : "normal",
                  }}
                >
                  {favorites.includes(lieu.name) ? "★ Favori" : "☆ Ajouter aux favoris"}
                </button>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}