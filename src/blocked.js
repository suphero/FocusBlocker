document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const originalUrl = params.get("url");
    if (originalUrl) {
      const decodedUrl = decodeURIComponent(originalUrl);
      try {
        const url = new URL(decodedUrl);
        if (url.protocol === "http:" || url.protocol === "https:") {
          document.getElementById("originalUrl").href = decodedUrl;
          document.getElementById("originalUrl").textContent = decodedUrl;
        }
      } catch {
        // Invalid URL, do not set link
      }
    }
  });
  