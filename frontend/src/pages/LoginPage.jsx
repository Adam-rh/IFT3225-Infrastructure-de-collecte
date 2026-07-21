import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await login({ email, password });
      loginUser(res.data.data.token, res.data.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Erreur de connexion.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "3rem auto", padding: "2rem" }}>
      <h1>Connexion</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.3rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
          Se connecter
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        Pas de compte ? <Link to="/register">S'inscrire</Link>
      </p>
    </div>
  );
}