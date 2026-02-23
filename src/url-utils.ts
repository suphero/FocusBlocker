export function isDomainBlocked(host: string, blockedDomain: string): boolean {
  return host === blockedDomain || host.endsWith("." + blockedDomain);
}

export function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function extractDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  // If it looks like a URL with protocol, extract hostname
  if (trimmed.includes("://")) {
    try {
      const url = new URL(trimmed);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.hostname || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Treat as bare domain — basic validation
  const domain = trimmed.replace(/\/.*$/, ""); // strip path
  if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
    return domain;
  }

  return null;
}

export function sanitizeWebsiteList(rawEntries: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of rawEntries) {
    const domain = extractDomain(entry);
    if (domain && !seen.has(domain)) {
      seen.add(domain);
      result.push(domain);
    }
  }

  return result;
}
