import { describe, it, expect } from "vitest";
import { getEffectiveBlockList } from "../storage";
import { STORAGE_DEFAULTS } from "../storage";
import type { StorageSchema, Category } from "../types";

function makeSchema(overrides: Partial<StorageSchema> = {}): StorageSchema {
  return { ...STORAGE_DEFAULTS, ...overrides };
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "test",
    name: "Test",
    icon: "T",
    websites: [],
    enabled: false,
    isBuiltIn: false,
    ...overrides,
  };
}

describe("getEffectiveBlockList", () => {
  it("should return individual websites when no categories exist", () => {
    const data = makeSchema({ websites: ["facebook.com", "x.com"] });
    const result = getEffectiveBlockList(data);
    expect(result).toContain("facebook.com");
    expect(result).toContain("x.com");
    expect(result).toHaveLength(2);
  });

  it("should merge enabled category websites with individual websites", () => {
    const data = makeSchema({
      websites: ["facebook.com"],
      categories: [
        makeCategory({ enabled: true, websites: ["youtube.com", "netflix.com"] }),
      ],
    });
    const result = getEffectiveBlockList(data);
    expect(result).toContain("facebook.com");
    expect(result).toContain("youtube.com");
    expect(result).toContain("netflix.com");
    expect(result).toHaveLength(3);
  });

  it("should not include websites from disabled categories", () => {
    const data = makeSchema({
      websites: ["facebook.com"],
      categories: [
        makeCategory({ enabled: false, websites: ["youtube.com"] }),
      ],
    });
    const result = getEffectiveBlockList(data);
    expect(result).toEqual(["facebook.com"]);
  });

  it("should deduplicate websites across categories and individual list", () => {
    const data = makeSchema({
      websites: ["facebook.com", "youtube.com"],
      categories: [
        makeCategory({ id: "cat1", enabled: true, websites: ["youtube.com", "netflix.com"] }),
        makeCategory({ id: "cat2", enabled: true, websites: ["facebook.com", "twitch.tv"] }),
      ],
    });
    const result = getEffectiveBlockList(data);
    expect(result).toHaveLength(4);
    expect(new Set(result).size).toBe(4);
  });

  it("should handle multiple categories with mixed enabled/disabled", () => {
    const data = makeSchema({
      websites: [],
      categories: [
        makeCategory({ id: "on", enabled: true, websites: ["a.com"] }),
        makeCategory({ id: "off", enabled: false, websites: ["b.com"] }),
        makeCategory({ id: "on2", enabled: true, websites: ["c.com"] }),
      ],
    });
    const result = getEffectiveBlockList(data);
    expect(result).toContain("a.com");
    expect(result).not.toContain("b.com");
    expect(result).toContain("c.com");
  });

  it("should return empty array when no websites and no enabled categories", () => {
    const data = makeSchema({ websites: [], categories: [] });
    const result = getEffectiveBlockList(data);
    expect(result).toEqual([]);
  });
});
