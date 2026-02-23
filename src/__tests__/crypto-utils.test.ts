import { describe, it, expect } from "vitest";
import { hashPassword, generateSalt } from "../crypto-utils";

describe("hashPassword", () => {
  it("should produce a 64-character hex string", async () => {
    const hash = await hashPassword("test123", "somesalt");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should produce consistent results for same input", async () => {
    const hash1 = await hashPassword("mypassword", "salt123");
    const hash2 = await hashPassword("mypassword", "salt123");
    expect(hash1).toBe(hash2);
  });

  it("should produce different results for different passwords", async () => {
    const hash1 = await hashPassword("password1", "salt");
    const hash2 = await hashPassword("password2", "salt");
    expect(hash1).not.toBe(hash2);
  });

  it("should produce different results for different salts", async () => {
    const hash1 = await hashPassword("password", "salt1");
    const hash2 = await hashPassword("password", "salt2");
    expect(hash1).not.toBe(hash2);
  });
});

describe("generateSalt", () => {
  it("should produce a 32-character hex string", () => {
    const salt = generateSalt();
    expect(salt).toMatch(/^[a-f0-9]{32}$/);
  });

  it("should produce unique values", () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(salt1).not.toBe(salt2);
  });
});
