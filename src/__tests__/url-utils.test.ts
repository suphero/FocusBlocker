import { describe, it, expect } from "vitest";
import { isDomainBlocked, isValidHttpUrl, extractDomain, sanitizeWebsiteList } from "../url-utils";

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

describe("extractDomain", () => {
  it("should extract domain from bare domain", () => {
    expect(extractDomain("facebook.com")).toBe("facebook.com");
  });

  it("should extract domain from URL with https", () => {
    expect(extractDomain("https://facebook.com/page")).toBe("facebook.com");
  });

  it("should extract domain from URL with http", () => {
    expect(extractDomain("http://m.facebook.com")).toBe("m.facebook.com");
  });

  it("should lowercase the domain", () => {
    expect(extractDomain("Facebook.COM")).toBe("facebook.com");
  });

  it("should trim whitespace", () => {
    expect(extractDomain("  facebook.com  ")).toBe("facebook.com");
  });

  it("should strip path from bare domain", () => {
    expect(extractDomain("facebook.com/page/123")).toBe("facebook.com");
  });

  it("should return null for empty string", () => {
    expect(extractDomain("")).toBeNull();
  });

  it("should return null for whitespace only", () => {
    expect(extractDomain("   ")).toBeNull();
  });

  it("should return null for single word without TLD", () => {
    expect(extractDomain("facebook")).toBeNull();
  });

  it("should return null for javascript: protocol", () => {
    expect(extractDomain("javascript:alert(1)")).toBeNull();
  });

  it("should accept short domains", () => {
    expect(extractDomain("a.co")).toBe("a.co");
  });
});

describe("sanitizeWebsiteList", () => {
  it("should filter out empty lines", () => {
    expect(sanitizeWebsiteList(["facebook.com", "", "x.com", ""])).toEqual([
      "facebook.com",
      "x.com",
    ]);
  });

  it("should deduplicate entries", () => {
    expect(sanitizeWebsiteList(["facebook.com", "facebook.com", "x.com"])).toEqual([
      "facebook.com",
      "x.com",
    ]);
  });

  it("should deduplicate case-insensitively", () => {
    expect(sanitizeWebsiteList(["Facebook.com", "facebook.com"])).toEqual(["facebook.com"]);
  });

  it("should extract domains from full URLs", () => {
    expect(sanitizeWebsiteList(["https://facebook.com/page"])).toEqual(["facebook.com"]);
  });

  it("should deduplicate bare domain and URL form", () => {
    expect(sanitizeWebsiteList(["facebook.com", "https://facebook.com/page"])).toEqual([
      "facebook.com",
    ]);
  });

  it("should filter out invalid entries", () => {
    expect(sanitizeWebsiteList(["facebook.com", "not valid", "", "x.com"])).toEqual([
      "facebook.com",
      "x.com",
    ]);
  });

  it("should return empty array for all invalid input", () => {
    expect(sanitizeWebsiteList(["", "  ", "hello"])).toEqual([]);
  });
});
