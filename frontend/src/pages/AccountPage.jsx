import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyStats, getMyLocations, addFavorite, removeFavorite, getMe } from "../api/auth";
import { getLocations } from "../api/locations";

export default function AccountPage() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [myLocations, setMyLocations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    async function fetchData() {
      try {
        const [statsRes, myLocsRes, allLocsRes, meRes] = await Promise.all([
          getMyStats(),
          getMyLocations(),
          getLocations(),
          getMe(),
        ]);
        setStats(statsRes.data.data);
        setMyLocations(myLocsRes.data.data);
        setAllLocations(allLocsRes.data.data);
        setFavorites(meRes.data.data.favorites || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, navigate]);

  const toggleFavorite = async (locationName) => {
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

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", padding: "0 2rem" }}>
      <h1>Mon compte</h1>
      <p><strong>Nom:</strong> {user.username}</p>
      <p><strong>Email:</strong> {user.email}</p>

      <h2>Mes contributions</h2>
      {stats && stats.totalObservations > 0 ? (
        <>
          <p>Total: {stats.totalObservations} observation(s)</p>
          {stats.byLocation.map((loc) => (
            <p key={loc.location}>{loc.location}: {loc.count} observation(s)</p>
          ))}
        </>
      ) : (
        <p>Aucune observation soumise.</p>
      )}

      <h2>Mes lieux</h2>
      {myLocations.length > 0 ? (
        myLocations.map((loc) => <p key={loc}>{loc}</p>)
      ) : (
        <p>Aucun lieu visité.</p>
      )}

      <h2>Favoris</h2>
      {allLocations.map((loc) => (
        <div key={loc.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <button
            onClick={() => toggleFavorite(loc.name)}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.3rem",
              cursor: "pointer",
            }}
          >
            {favorites.includes(loc.name) ? "⭐" : "☆"}
          </button>
          <span>{loc.label}</span>
        </div>
      ))}

      <button
        onClick={() => { logoutUser(); navigate("/"); }}
        style={{
          marginTop: "2rem",
          padding: "0.7rem 2rem",
          background: "#e74c3c",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Déconnexion
      </button>
    </div>
  );
}