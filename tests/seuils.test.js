import { describe, it, expect } from "vitest";
import { classifierAmbiance } from "../src/config/seuils.js";

describe("classifierAmbiance", () => {
  it("classe une valeur basse comme calme", () => {
    expect(classifierAmbiance(35)).toBe("calme");
  });

  it("classe exactement 40 dB comme modéré (borne inférieure)", () => {
    expect(classifierAmbiance(40)).toBe("modéré");
  });

  it("classe 39.99 dB comme calme (juste sous la borne)", () => {
    expect(classifierAmbiance(39.99)).toBe("calme");
  });

  it("classe exactement 60 dB comme animé (borne supérieure)", () => {
    expect(classifierAmbiance(60)).toBe("animé");
  });

  it("ne produit plus la catégorie retirée bruyant au-delà de 75 dB", () => {
    expect(classifierAmbiance(90)).toBe("animé");
  });

  it("retourne inconnu pour null, undefined et NaN", () => {
    expect(classifierAmbiance(null)).toBe("inconnu");
    expect(classifierAmbiance(undefined)).toBe("inconnu");
    expect(classifierAmbiance(NaN)).toBe("inconnu");
  });
});
