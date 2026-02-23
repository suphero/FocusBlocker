import { isValidHttpUrl } from "./url-utils";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const originalUrl = params.get("url");
  if (originalUrl) {
    const decodedUrl = decodeURIComponent(originalUrl);
    if (isValidHttpUrl(decodedUrl)) {
      const link = document.getElementById("originalUrl") as HTMLAnchorElement;
      link.href = decodedUrl;
      link.textContent = decodedUrl;
    }
  }
});
