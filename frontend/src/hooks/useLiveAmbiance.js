import { useEffect, useState } from "react";
import { API_URL } from "../api/client";

/**
 * Écoute le flux SSE d'un lieu et expose le dernier snapshot reçu.
 * On ne ferme pas la connexion sur erreur : EventSource se reconnecte
 * automatiquement, ce qui permet de survivre à une coupure réseau ou
 * au réveil d'une instance Render endormie.
 */
export function useLiveAmbiance(name) {
  const [snapshot, setSnapshot] = useState(null);
  const [enDirect, setEnDirect] = useState(false);

  useEffect(() => {
    if (!name) return;

    const source = new EventSource(`${API_URL}/ambiance/${name}/stream`);

    source.onopen = () => setEnDirect(true);

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEnDirect(true);
        if (data.avgAmplitude !== null) setSnapshot(data);
      } catch {
        // trame illisible : on ignore et on attend la suivante
      }
    };

    source.onerror = () => setEnDirect(false);

    return () => {
      source.close();
      setEnDirect(false);
      setSnapshot(null);
    };
  }, [name]);

  return { snapshot, enDirect };
}