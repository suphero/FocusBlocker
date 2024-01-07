document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const originalUrl = params.get("url");
    if (originalUrl) {
      const decodedUrl = decodeURIComponent(originalUrl);
      document.getElementById("originalUrl").href = decodedUrl;
      document.getElementById("originalUrl").textContent = decodedUrl;
    }
  });
  