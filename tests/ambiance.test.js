import { describe, it, expect } from "vitest";
import {
  calculerSnapshot,
  grouperParHeure,
  grouperParTranche,
  calculerStats,
} from "../src/services/ambiance.js";

function mesure(annee, mois, jour, heure, minute, value) {
  return { timestamp: new Date(annee, mois, jour, heure, minute), value };
}

describe("calculerSnapshot", () => {
  it("calcule la moyenne, le min et le max sur plusieurs mesures", () => {
    const r = calculerSnapshot([
      mesure(2026, 0, 15, 9, 0, 30),
      mesure(2026, 0, 15, 9, 5, 50),
    ]);
    expect(r.avgAmplitude).toBe(40);
    expect(r.minAmplitude).toBe(30);
    expect(r.maxAmplitude).toBe(50);
    expect(r.measurementCount).toBe(2);
  });

  it("retourne inconnu sur un tableau vide sans planter", () => {
    const r = calculerSnapshot([]);
    expect(r.classification).toBe("inconnu");
    expect(r.avgAmplitude).toBeNull();
    expect(r.measurementCount).toBe(0);
  });

  it("tolère une entrée qui n'est pas un tableau", () => {
    expect(calculerSnapshot(undefined).classification).toBe("inconnu");
  });

  it("arrondit la moyenne à deux décimales", () => {
    const r = calculerSnapshot([
      mesure(2026, 0, 15, 9, 0, 10),
      mesure(2026, 0, 15, 9, 1, 10),
      mesure(2026, 0, 15, 9, 2, 11),
    ]);
    expect(r.avgAmplitude).toBe(10.33);
  });
});

describe("grouperParHeure", () => {
  it("regroupe les mesures par heure de la journée", () => {
    const r = grouperParHeure([
      mesure(2026, 0, 15, 9, 0, 30),
      mesure(2026, 0, 15, 9, 30, 40),
      mesure(2026, 0, 15, 14, 0, 70),
    ]);
    expect(r.allHours).toHaveLength(2);
    expect(r.allHours[0].hour).toBe(9);
    expect(r.allHours[0].avgAmplitude).toBe(35);
    expect(r.allHours[0].sampleCount).toBe(2);
  });

  it("trie du plus calme au plus animé", () => {
    const r = grouperParHeure([
      mesure(2026, 0, 15, 20, 0, 70),
      mesure(2026, 0, 15, 6, 0, 30),
    ]);
    expect(r.allHours[0].hour).toBe(6);
    expect(r.quietest[0].hour).toBe(6);
    expect(r.loudest[0].hour).toBe(20);
  });

  it("retourne des listes vides sur un tableau vide", () => {
    const r = grouperParHeure([]);
    expect(r.allHours).toEqual([]);
    expect(r.quietest).toEqual([]);
  });

  it("formate le libellé de l'heure sur deux chiffres", () => {
    const r = grouperParHeure([mesure(2026, 0, 15, 9, 0, 30)]);
    expect(r.allHours[0].label).toBe("09:00 – 10:00");
  });

  it("gère le passage de 23h à 00h dans le libellé", () => {
    const r = grouperParHeure([mesure(2026, 0, 15, 23, 0, 30)]);
    expect(r.allHours[0].label).toBe("23:00 – 00:00");
  });
});

describe("grouperParTranche", () => {
  it("regroupe deux mesures de la même tranche de 15 minutes", () => {
    const r = grouperParTranche([
      mesure(2026, 0, 15, 9, 0, 30),
      mesure(2026, 0, 15, 9, 10, 40),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].avgAmplitude).toBe(35);
  });

  it("sépare deux mesures de tranches différentes", () => {
    const r = grouperParTranche([
      mesure(2026, 0, 15, 9, 0, 30),
      mesure(2026, 0, 15, 9, 20, 40),
    ]);
    expect(r).toHaveLength(2);
  });

  it("retourne un tableau vide sans mesure", () => {
    expect(grouperParTranche([])).toEqual([]);
  });

  it("trie les tranches par ordre chronologique", () => {
    const r = grouperParTranche([
      mesure(2026, 0, 15, 14, 0, 60),
      mesure(2026, 0, 15, 9, 0, 30),
    ]);
    expect(r[0].window.getTime()).toBeLessThan(r[1].window.getTime());
  });
});

describe("calculerStats", () => {
  it("agrège mesures et observations", () => {
    const r = calculerStats(
      [mesure(2026, 0, 15, 9, 0, 30), mesure(2026, 0, 15, 9, 5, 50)],
      [{ vibe: "calme" }, { vibe: "calme" }, { vibe: "animé" }]
    );
    expect(r.measurements.total).toBe(2);
    expect(r.measurements.avgAmplitude).toBe(40);
    expect(r.observations.total).toBe(3);
    expect(r.observations.vibeDistribution[0]).toEqual({ vibe: "calme", count: 2 });
  });

  it("ventile les mesures par jour de la semaine", () => {
    const r = calculerStats([mesure(2026, 0, 15, 9, 0, 30)], []);
    expect(r.byDayOfWeek).toHaveLength(1);
    expect(r.byDayOfWeek[0].day).toBe("jeudi");
  });

  it("fonctionne sans aucune donnée", () => {
    const r = calculerStats([], []);
    expect(r.measurements.total).toBe(0);
    expect(r.measurements.overallClassification).toBe("inconnu");
    expect(r.byDayOfWeek).toEqual([]);
  });

  it("gère un lieu avec observations mais sans mesure", () => {
    const r = calculerStats([], [{ vibe: "animé" }]);
    expect(r.measurements.avgAmplitude).toBeNull();
    expect(r.observations.total).toBe(1);
  });
});
