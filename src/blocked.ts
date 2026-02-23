import { isValidHttpUrl } from "./url-utils";
import { localizeHtml } from "./i18n-utils";

document.addEventListener("DOMContentLoaded", () => {
  localizeHtml();
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
