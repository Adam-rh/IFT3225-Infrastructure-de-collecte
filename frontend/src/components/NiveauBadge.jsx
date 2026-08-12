import { couleurNiveau } from "../lib/ambiance";

const TAILLES = {
  petit: { padding: "0.4rem 1rem", fontSize: "0.85rem" },
  grand: { padding: "0.5rem 1.5rem", fontSize: "1.2rem" },
};

export default function NiveauBadge({ classification, taille = "petit" }) {
  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: "20px",
        background: couleurNiveau(classification),
        color: "white",
        fontWeight: "bold",
        ...TAILLES[taille],
      }}
    >
      {classification}
    </span>
  );
}