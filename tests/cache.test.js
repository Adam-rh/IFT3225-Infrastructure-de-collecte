import { describe, it, expect, beforeEach } from "vitest";
import * as cache from "../src/cache/memoire.js";

describe("cache mémoire", () => {
  beforeEach(() => cache.vider());

  it("relit une valeur écrite", () => {
    cache.ecrire(cache.cle("stats", "cafe"), { a: 1 }, 1000);
    expect(cache.lire(cache.cle("stats", "cafe"))).toEqual({ a: 1 });
  });

  it("retourne null pour une clé absente", () => {
    expect(cache.lire("inexistant")).toBeNull();
  });

  it("expire une entrée dont le TTL est dépassé", () => {
    cache.ecrire("k", "v", -1);
    expect(cache.lire("k")).toBeNull();
  });

  it("invalide un lieu sans toucher aux autres", () => {
    cache.ecrire(cache.cle("stats", "cafe"), 1, 10_000);
    cache.ecrire(cache.cle("quiet-hours", "cafe"), 2, 10_000);
    cache.ecrire(cache.cle("stats", "parc"), 3, 10_000);

    cache.invaliderLieu("cafe");

    expect(cache.lire(cache.cle("stats", "cafe"))).toBeNull();
    expect(cache.lire(cache.cle("quiet-hours", "cafe"))).toBeNull();
    expect(cache.lire(cache.cle("stats", "parc"))).toBe(3);
  });

  it("purge aussi le classement global, dont la portée dépasse un seul lieu", () => {
    cache.ecrire("best:all", ["classement"], 10_000);
    cache.invaliderLieu("cafe");
    expect(cache.lire("best:all")).toBeNull();
  });

  it("calcule le taux de hit", () => {
    cache.ecrire("k", "v", 10_000);
    cache.lire("k");
    cache.lire("k");
    cache.lire("absent");
    expect(cache.metriques().tauxHit).toBe(67);
  });
});