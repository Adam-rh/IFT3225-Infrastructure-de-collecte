export default function EtatErreur({ message, onReessayer }) {
  return (
    <div role="alert" style={{ padding: "2rem", textAlign: "center" }}>
      <p style={{ color: "#e74c3c", marginBottom: onReessayer ? "1rem" : 0 }}>{message}</p>
      {onReessayer && (
        <button
          onClick={onReessayer}
          style={{
            padding: "0.5rem 1.5rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            background: "white",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      )}
    </div>
  );
}