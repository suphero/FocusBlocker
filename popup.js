document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get(["enabled", "websites"]).then((result) => {
    document.getElementById("enabled").checked = result.enabled || false;
    document.getElementById("websites").innerHTML = result.websites || '';
  });

  document.getElementById("save").addEventListener("click", function () {
    const enabled = document.getElementById("enabled").checked;
    const websites = document.getElementById("websites").value;
    chrome.storage.local.set({ enabled, websites }, function () {
      console.log("Saved");
      window.close();
    });
  });
});
