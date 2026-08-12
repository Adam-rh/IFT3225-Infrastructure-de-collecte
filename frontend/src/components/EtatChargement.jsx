/**
 * Skeleton générique. L'animation shimmer est portée par la classe .skeleton
 * définie dans index.css.
 */
export default function EtatChargement({ lignes = 3, hauteur = 100, largeurTitre = 200 }) {
  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 2rem" }}>
      <div className="skeleton" style={{ width: largeurTitre, height: 30, marginBottom: "1rem" }} />
      {Array.from({ length: lignes }, (_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ width: "100%", height: hauteur, marginBottom: "1rem" }}
        />
      ))}
    </div>
  );
}