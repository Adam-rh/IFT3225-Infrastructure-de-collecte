import { describe, it, expect } from "vitest";
import { classerLieux } from "../src/services/ambiance.js";

const LIEUX = [
  { name: "cafe", label: "Café", latitude: 45.5, longitude: -73.6 },
  { name: "parc", label: "Parc", latitude: 45.6, longitude: -73.7 },
  { name: "gare", label: "Gare", latitude: 45.7, longitude: -73.8 },
];

function mesure(location, heure, value) {
  return { location, timestamp: new Date(2026, 0, 15, heure, 0), value };
}

describe("classerLieux", () => {
  it("classe du plus calme au plus animé", () => {
    const r = classerLieux(LIEUX, [
      mesure("cafe", 9, 55),
      mesure("parc", 9, 35),
      mesure("gare", 9, 70),
    ]);
    expect(r.map((c) => c.location)).toEqual(["parc", "cafe", "gare"]);
  });

  it("place les lieux sans données en dernier au lieu de les masquer", () => {
    const r = classerLieux(LIEUX, [mesure("gare", 9, 70)]);
    expect(r).toHaveLength(3);
    expect(r[0].location).toBe("gare");
    expect(r[1].avgAmplitude).toBeNull();
    expect(r[2].avgAmplitude).toBeNull();
  });

  it("départage une égalité parfaite par le nom du lieu", () => {
    const r = classerLieux(LIEUX, [
      mesure("cafe", 9, 50),
      mesure("parc", 9, 50),
      mesure("gare", 9, 50),
    ]);
    expect(r.map((c) => c.location)).toEqual(["cafe", "gare", "parc"]);
  });

  it("filtre sur une heure précise de la journée", () => {
    const r = classerLieux(
      LIEUX,
      [mesure("cafe", 9, 30), mesure("cafe", 20, 80), mesure("parc", 20, 40)],
      20
    );
    expect(r[0].location).toBe("parc");
    expect(r[0].avgAmplitude).toBe(40);
    expect(r[1].location).toBe("cafe");
    expect(r[1].avgAmplitude).toBe(80);
  });

  it("retourne tous les lieux en inconnu si aucune mesure ne tombe à cette heure", () => {
    const r = classerLieux(LIEUX, [mesure("cafe", 9, 30)], 3);
    expect(r.every((c) => c.classification === "inconnu")).toBe(true);
    expect(r.every((c) => c.sampleCount === 0)).toBe(true);
  });

  it("gradue la confiance selon le nombre d'échantillons", () => {
    const beaucoup = Array.from({ length: 25 }, () => mesure("cafe", 9, 50));
    const r = classerLieux(LIEUX, [...beaucoup, mesure("parc", 9, 45)]);
    expect(r.find((c) => c.location === "parc").confiance).toBe("faible");
    expect(r.find((c) => c.location === "cafe").confiance).toBe("bonne");
    expect(r.find((c) => c.location === "gare").confiance).toBe("aucune");
  });

  it("retourne un tableau vide si aucun lieu n'est enregistré", () => {
    expect(classerLieux([], [])).toEqual([]);
  });

  it("tolère des mesures absentes ou nulles", () => {
    const r = classerLieux(LIEUX, null);
    expect(r).toHaveLength(3);
    expect(r.every((c) => c.classification === "inconnu")).toBe(true);
  });
});