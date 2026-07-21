import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logoutUser } = useAuth();

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "1rem 2rem",
      background: "#1a1a2e",
      color: "white",
    }}>
      <Link to="/" style={{ color: "white", textDecoration: "none", fontSize: "1.3rem", fontWeight: "bold" }}>
         SonoMap
      </Link>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link to="/" style={{ color: "#ccc", textDecoration: "none" }}>Carte</Link>
        <Link to="/list" style={{ color: "#ccc", textDecoration: "none" }}>Liste</Link>

        {user ? (
          <>
            <Link to="/account" style={{ color: "#ccc", textDecoration: "none" }}>Mon compte</Link>
            <Link to="/submit" style={{ color: "#ccc", textDecoration: "none" }}>Soumettre</Link>
            <span style={{ color: "#8888ff" }}>{user.username}</span>
            <button
              onClick={logoutUser}
              style={{
                background: "transparent",
                color: "#ff6b6b",
                border: "1px solid #ff6b6b",
                padding: "0.3rem 0.8rem",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: "#ccc", textDecoration: "none" }}>Connexion</Link>
            <Link to="/register" style={{ color: "#4ecdc4", textDecoration: "none" }}>Inscription</Link>
          </>
        )}
      </div>
    </nav>
  );
}