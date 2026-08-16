import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyStats, getMyLocations } from "../api/auth";
import { getLocations } from "../api/locations";
import { useFavorites } from "../hooks/useFavorites";
import EtatChargement from "../components/EtatChargement";
import EtatErreur from "../components/EtatErreur";

export default function AccountPage() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const { estFavori, basculer } = useFavorites();

  const [stats, setStats] = useState(null);
  const [myLocations, setMyLocations] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    let annule = false;

    (async () => {
      try {
        const [statsRes, myLocsRes, allLocsRes] = await Promise.all([
          getMyStats(),
          getMyLocations(),
          getLocations(),
        ]);

        if (annule) return;

        setStats(statsRes.data.data);
        setMyLocations(myLocsRes.data.data);
        setAllLocations(allLocsRes.data.data);
      } catch {
        if (!annule) setError("Impossible de charger votre compte.");
      } finally {
        if (!annule) setLoading(false);
      }
    })();

    return () => {
      annule = true;
    };
  }, [user, navigate]);

  if (loading) return <EtatChargement lignes={2} hauteur={120} />;
  if (error) return <EtatErreur message={error} />;

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", padding: "0 2rem" }}>
      <h1>Mon compte</h1>
      <p><strong>Nom :</strong> {user.username}</p>
      <p><strong>Courriel :</strong> {user.email}</p>

      <h2>Mes contributions</h2>
      {stats && stats.totalObservations > 0 ? (
        <>
          <p>Total : {stats.totalObservations} observation(s)</p>
          {stats.byLocation.map((loc) => (
            <p key={loc.location}>
              {loc.location} : {loc.count} observation(s)
            </p>
          ))}
        </>
      ) : (
        <p style={{ color: "#888" }}>Aucune observation soumise.</p>
      )}

      <h2>Mes lieux</h2>
      {myLocations.length > 0 ? (
        myLocations.map((loc) => <p key={loc}>{loc}</p>)
      ) : (
        <p style={{ color: "#888" }}>Aucun lieu visité.</p>
      )}

      <h2>Favoris</h2>
      {allLocations.map((loc) => (
        <div
          key={loc.name}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}
        >
          <button
            onClick={() => basculer(loc.name)}
            aria-label={
              estFavori(loc.name)
                ? `Retirer ${loc.label} des favoris`
                : `Ajouter ${loc.label} aux favoris`
            }
            aria-pressed={estFavori(loc.name)}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.3rem",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            {estFavori(loc.name) ? "⭐" : "☆"}
          </button>
          <span>{loc.label}</span>
        </div>
      ))}

      <button
        onClick={() => {
          logoutUser();
          navigate("/");
        }}
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