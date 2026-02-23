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
