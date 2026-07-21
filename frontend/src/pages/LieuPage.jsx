import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { getStats, getHistory, getQuietHours } from "../api/ambiance";
import { getLocation } from "../api/locations";
import { API_URL } from "../api/client";

const BADGE_COLORS = {
  calme: "#2ecc71",
  modéré: "#f39c12",
  animé: "#e74c3c",
  inconnu: "#95a5a6",
};

function getBarColor(classification) {
  return BADGE_COLORS[classification] || BADGE_COLORS.inconnu;
}

function niveauHumain(db) {
  if (db === null) return "";
  if (db < 40) return "Très calme";
  if (db < 60) return "Modéré";
  if (db < 75) return "Élevé";
  return "Très élevé";
}

export default function LieuPage() {
  const { name } = useParams();
  const [location, setLocation] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [quietHours, setQuietHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveClassification, setLiveClassification] = useState(null);
  const [liveAmplitude, setLiveAmplitude] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [locRes, statsRes, histRes, quietRes] = await Promise.all([
          getLocation(name),
          getStats(name),
          getHistory(name, "7d"),
          getQuietHours(name),
        ]);

        setLocation(locRes.data.data);
        setStats(statsRes.data.data);
        setQuietHours(quietRes.data.data);

        const timeline = histRes.data.data.timeline.map((t) => ({
          ...t,
          time: new Date(t.window).toLocaleString("fr-CA", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setHistory(timeline);
      } catch {
        setError("Impossible de charger les données de ce lieu.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [name]);

  useEffect(() => {
    const source = new EventSource(`${API_URL}/ambiance/${name}/stream`);

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.avgAmplitude !== null) {
        setLiveClassification(data.classification);
        setLiveAmplitude(data.avgAmplitude);
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [name]);

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <div className="skeleton" style={{ width: 200, height: 30, margin: "0 auto 1rem" }} />
        <div className="skeleton" style={{ width: "100%", height: 300, marginBottom: "1rem" }} />
        <div className="skeleton" style={{ width: "100%", height: 200 }} />
      </div>
    );
  }
  if (error) return <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>{error}</div>;

  const classification = stats?.measurements?.overallClassification || "inconnu";

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 2rem" }}>
      <Link to="/" style={{ color: "#888", textDecoration: "none", fontSize: "0.9rem" }}>← Retour à la carte</Link>

      <h1 style={{ marginTop: "0.5rem" }}>{location?.label || name}</h1>

      <span style={{
        display: "inline-block",
        padding: "0.5rem 1.5rem",
        borderRadius: "20px",
        background: BADGE_COLORS[classification],
        color: "white",
        fontSize: "1.2rem",
        fontWeight: "bold",
        marginBottom: "1.5rem",
      }}>
        {classification}
      </span>

      {liveClassification && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginLeft: "1rem",
          padding: "0.3rem 0.8rem",
          borderRadius: "12px",
          background: "#f0f0f0",
          fontSize: "0.85rem",
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#2ecc71",
            animation: "pulse 1.5s infinite",
          }} />
          En direct : {liveClassification} ({liveAmplitude})
        </div>
      )}

      <div style={{
        display: "flex",
        borderRadius: "8px",
        overflow: "hidden",
        margin: "1rem 0",
        fontSize: "0.75rem",
        fontWeight: "bold",
        maxWidth: 500,
      }}>
        <div style={{ flex: 2, background: "#2ecc71", color: "white", padding: "0.5rem", textAlign: "center" }}>
          <div>Calme</div>
          <div style={{ fontWeight: "normal", fontSize: "0.7rem" }}>0 – 40 dB</div>
        </div>
        <div style={{ flex: 1, background: "#f39c12", color: "white", padding: "0.5rem", textAlign: "center" }}>
          <div>Modéré</div>
          <div style={{ fontWeight: "normal", fontSize: "0.7rem" }}>40 – 60 dB</div>
        </div>
        <div style={{ flex: 1, background: "#e74c3c", color: "white", padding: "0.5rem", textAlign: "center" }}>
          <div>Animé</div>
          <div style={{ fontWeight: "normal", fontSize: "0.7rem" }}>60 – 75 dB</div>
        </div>
      </div>
      <p style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: "1rem" }}>
        Calme = bibliothèque, conversation douce | Modéré = conversation normale | Animé = restaurant, groupe
      </p>

      {stats && (
        <div style={{
          display: "flex",
          gap: "1.5rem",
          margin: "1rem 0 2rem",
          flexWrap: "wrap",
        }}>
          {[
            { label: "Moyenne", value: `${stats.measurements.avgAmplitude} dB`, sub: niveauHumain(stats.measurements.avgAmplitude) },
            { label: "Min", value: `${stats.measurements.minAmplitude} dB`, sub: niveauHumain(stats.measurements.minAmplitude) },
            { label: "Max", value: `${stats.measurements.maxAmplitude} dB`, sub: niveauHumain(stats.measurements.maxAmplitude) },
            { label: "Mesures", value: stats.measurements.total, sub: "" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "white",
              padding: "1rem 1.5rem",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              minWidth: 120,
              textAlign: "center",
            }}>
              <div style={{ fontSize: "0.85rem", color: "#888" }}>{s.label}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: "0.75rem", color: "#aaa" }}>{s.sub}</div>}
            </div>
          ))}
        </div>
      )}

      <h2>Historique</h2>
      {history.length > 0 ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "1rem", marginBottom: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history}>
              <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis domain={[0, 110]} label={{ value: "Niveau sonore", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
              <Tooltip formatter={(value) => [`${value} dB (${niveauHumain(value)})`, "Niveau sonore"]} />
              <ReferenceLine y={40} stroke="#2ecc71" strokeDasharray="3 3" label="calme" />
              <ReferenceLine y={60} stroke="#f39c12" strokeDasharray="3 3" label="modéré" />
              <ReferenceLine y={75} stroke="#e74c3c" strokeDasharray="3 3" label="animé" />
              <Line type="monotone" dataKey="avgAmplitude" stroke="#1a1a2e" strokeWidth={2} dot={false} name="Niveau sonore" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p style={{ color: "#888" }}>Aucune donnée d'historique.</p>
      )}

      <h2>Créneaux calmes</h2>
      {quietHours && quietHours.allHours.length > 0 ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "1rem", marginBottom: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={quietHours.allHours}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
              <YAxis domain={[0, 110]} label={{ value: "Niveau sonore", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
              <Tooltip formatter={(value) => [`${value} dB (${niveauHumain(value)})`, "Niveau sonore"]} />
              <ReferenceLine y={40} stroke="#2ecc71" strokeDasharray="3 3" />
              <ReferenceLine y={60} stroke="#f39c12" strokeDasharray="3 3" />
              <ReferenceLine y={75} stroke="#e74c3c" strokeDasharray="3 3" />
              <Bar dataKey="avgAmplitude" name="Niveau sonore" radius={[4, 4, 0, 0]}>
                {quietHours.allHours.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.classification)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{ display: "flex", gap: "2rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3 style={{ color: "#2ecc71", fontSize: "1rem" }}>Les plus calmes</h3>
              {quietHours.quietest.map((h) => (
                <p key={h.hour} style={{ fontSize: "0.9rem" }}>
                  {h.label} — {h.avgAmplitude} dB ({niveauHumain(h.avgAmplitude)})
                </p>
              ))}
            </div>
            <div>
              <h3 style={{ color: "#e74c3c", fontSize: "1rem" }}>Les plus animés</h3>
              {quietHours.loudest.map((h) => (
                <p key={h.hour} style={{ fontSize: "0.9rem" }}>
                  {h.label} — {h.avgAmplitude} dB ({niveauHumain(h.avgAmplitude)})
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
