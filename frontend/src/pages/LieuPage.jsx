import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { useLieuData } from "../hooks/useLieuData";
import { useLiveAmbiance } from "../hooks/useLiveAmbiance";
import { couleurNiveau, niveauHumain, formaterEcart, SEUILS, ECHELLE } from "../lib/ambiance";
import NiveauBadge from "../components/NiveauBadge";
import EtatChargement from "../components/EtatChargement";
import EtatErreur from "../components/EtatErreur";

const CARTE = {
  background: "white",
  borderRadius: "8px",
  padding: "1rem",
  marginBottom: "2rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const PERIODES = ["7d", "30d", "90d"];

function boutonPeriode(actif) {
  return {
    padding: "0.3rem 0.8rem",
    borderRadius: "20px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.8rem",
    background: actif ? "#1a1a2e" : "#ddd",
    color: actif ? "white" : "#333",
  };
}

export default function LieuPage() {
  const { name } = useParams();
  const [periode, setPeriode] = useState("30d");
  const { location, stats, history, quietHours, loading, error } = useLieuData(name, periode);
  const { snapshot, enDirect } = useLiveAmbiance(name);

  if (loading) return <EtatChargement lignes={2} hauteur={250} />;
  if (error) return <EtatErreur message={error} />;

  const classification = stats?.measurements?.overallClassification ?? "inconnu";
  const moyenneLieu = stats?.measurements?.avgAmplitude ?? null;

  const cartesStats = stats
    ? [
        { label: "Moyenne", value: `${stats.measurements.avgAmplitude} dB`, sub: niveauHumain(stats.measurements.avgAmplitude) },
        { label: "Min", value: `${stats.measurements.minAmplitude} dB`, sub: niveauHumain(stats.measurements.minAmplitude) },
        { label: "Max", value: `${stats.measurements.maxAmplitude} dB`, sub: niveauHumain(stats.measurements.maxAmplitude) },
        { label: "Mesures", value: stats.measurements.total, sub: "" },
      ]
    : [];

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 2rem" }}>
      <Link to="/" style={{ color: "#888", textDecoration: "none", fontSize: "0.9rem" }}>
        ← Retour à la carte
      </Link>

      <h1 style={{ marginTop: "0.5rem" }}>{location?.label ?? name}</h1>

      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <NiveauBadge classification={classification} taille="grand" />

        {enDirect && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.3rem 0.8rem",
              borderRadius: "12px",
              background: "#f0f0f0",
              fontSize: "0.85rem",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#2ecc71",
                animation: "pulse 1.5s infinite",
              }}
            />
            {snapshot
              ? `En direct : ${snapshot.classification} (${snapshot.avgAmplitude})`
              : "En écoute — aucune mesure dans les 30 dernières minutes"}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          borderRadius: "8px",
          overflow: "hidden",
          margin: "1rem 0",
          fontSize: "0.75rem",
          fontWeight: "bold",
          maxWidth: 500,
        }}
      >
        {ECHELLE.map((n) => (
          <div
            key={n.classe}
            style={{
              flex: n.flex,
              background: couleurNiveau(n.classe),
              color: "white",
              padding: "0.5rem",
              textAlign: "center",
            }}
          >
            <div>{n.libelle}</div>
            <div style={{ fontWeight: "normal", fontSize: "0.7rem" }}>{n.plage}</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: "1rem" }}>
        Calme = bibliothèque, conversation douce | Modéré = conversation normale | Animé = restaurant, groupe
      </p>

      {cartesStats.length > 0 && (
        <div style={{ display: "flex", gap: "1.5rem", margin: "1rem 0 2rem", flexWrap: "wrap" }}>
          {cartesStats.map((s) => (
            <div
              key={s.label}
              style={{
                background: "white",
                padding: "1rem 1.5rem",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                minWidth: 120,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.85rem", color: "#888" }}>{s.label}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: "0.75rem", color: "#aaa" }}>{s.sub}</div>}
            </div>
          ))}
        </div>
      )}

      <h2>Historique</h2>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        {PERIODES.map((p) => (
          <button key={p} onClick={() => setPeriode(p)} aria-pressed={periode === p} style={boutonPeriode(periode === p)}>
            {p}
          </button>
        ))}
      </div>

      {history.length > 0 ? (
        <div style={CARTE}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history}>
              <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis
                domain={[0, 110]}
                label={{ value: "Niveau sonore", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
              />
              <Tooltip formatter={(v) => [`${v} dB (${niveauHumain(v)})`, "Niveau sonore"]} />
              <ReferenceLine y={SEUILS.calme} stroke={couleurNiveau("calme")} strokeDasharray="3 3" label="calme" />
              <ReferenceLine y={SEUILS.modere} stroke={couleurNiveau("modéré")} strokeDasharray="3 3" label="modéré" />
              <Line type="monotone" dataKey="avgAmplitude" stroke="#1a1a2e" strokeWidth={2} dot={false} name="Niveau sonore" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p style={{ color: "#888", marginBottom: "2rem" }}>
          Aucune mesure sur cette période. Essayez une fenêtre plus large.
        </p>
      )}

      <h2>Créneaux les plus calmes</h2>
      <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.5rem" }}>
        Classement relatif à ce lieu. L'écart est calculé sur sa moyenne
        {moyenneLieu !== null ? ` de ${moyenneLieu} dB` : ""}.
      </p>

      {quietHours && quietHours.allHours.length > 0 ? (
        <div style={CARTE}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={quietHours.allHours}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
              <YAxis
                domain={[0, 110]}
                label={{ value: "Niveau sonore", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
              />
              <Tooltip formatter={(v) => [`${v} dB (${niveauHumain(v)})`, "Niveau sonore"]} />
              <ReferenceLine y={SEUILS.calme} stroke={couleurNiveau("calme")} strokeDasharray="3 3" />
              <ReferenceLine y={SEUILS.modere} stroke={couleurNiveau("modéré")} strokeDasharray="3 3" />
              <Bar dataKey="avgAmplitude" name="Niveau sonore" radius={[4, 4, 0, 0]}>
                {quietHours.allHours.map((h) => (
                  <Cell key={h.hour} fill={couleurNiveau(h.classification)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{ display: "flex", gap: "2rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3 style={{ color: couleurNiveau("calme"), fontSize: "1rem" }}>Les moins bruyants</h3>
              {quietHours.quietest.map((h) => (
                <p key={h.hour} style={{ fontSize: "0.9rem" }}>
                  {h.label} — {h.avgAmplitude} dB{" "}
                  <span style={{ color: "#888" }}>({formaterEcart(h.avgAmplitude, moyenneLieu)})</span>
                </p>
              ))}
            </div>
            <div>
              <h3 style={{ color: couleurNiveau("animé"), fontSize: "1rem" }}>Les plus animés</h3>
              {quietHours.loudest.map((h) => (
                <p key={h.hour} style={{ fontSize: "0.9rem" }}>
                  {h.label} — {h.avgAmplitude} dB{" "}
                  <span style={{ color: "#888" }}>({formaterEcart(h.avgAmplitude, moyenneLieu)})</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p style={{ color: "#888" }}>Aucune donnée de créneaux.</p>
      )}
    </div>
  );
}