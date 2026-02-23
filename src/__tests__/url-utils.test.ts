import { describe, it, expect } from "vitest";
import { isDomainBlocked, isValidHttpUrl } from "../url-utils";

describe("isDomainBlocked", () => {
  it("should match exact domain", () => {
    expect(isDomainBlocked("facebook.com", "facebook.com")).toBe(true);
  });

  it("should match subdomain", () => {
    expect(isDomainBlocked("m.facebook.com", "facebook.com")).toBe(true);
  });

  it("should not match partial domain name", () => {
    expect(isDomainBlocked("not-facebook.com", "facebook.com")).toBe(false);
  });

  it("should not match domain suffix attack", () => {
    expect(isDomainBlocked("facebook.com.evil.com", "facebook.com")).toBe(false);
  });

  it("should not match unrelated domain", () => {
    expect(isDomainBlocked("google.com", "facebook.com")).toBe(false);
  });
});

describe("isValidHttpUrl", () => {
  it("should accept http URLs", () => {
    expect(isValidHttpUrl("http://example.com")).toBe(true);
  });

  it("should accept https URLs", () => {
    expect(isValidHttpUrl("https://example.com")).toBe(true);
  });

  it("should reject javascript protocol", () => {
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
  });

  it("should reject data protocol", () => {
    expect(isValidHttpUrl("data:text/html,<h1>hi</h1>")).toBe(false);
  });

  it("should reject invalid URLs", () => {
    expect(isValidHttpUrl("not a url")).toBe(false);
  });
});
