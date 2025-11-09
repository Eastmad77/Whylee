document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("mmMenuBtn");
  const sideMenu = document.getElementById("mmSideMenu");
  const soundBtn = document.getElementById("soundBtn");
  const notifyBtn = document.getElementById("notifyItem");

  // --- Menu toggle ---
  if (menuBtn && sideMenu) {
    menuBtn.onclick = () => {
      const isOpen = sideMenu.getAttribute("aria-hidden") === "false";
      sideMenu.setAttribute("aria-hidden", isOpen ? "true" : "false");
      sideMenu.classList.toggle("open", !isOpen);
    };
  }

  // --- Sound toggle ---
  if (soundBtn) {
    let soundOn = localStorage.getItem("whylee_sound") !== "off";
    soundBtn.textContent = soundOn ? "🔊" : "🔇";
    soundBtn.onclick = () => {
      soundOn = !soundOn;
      localStorage.setItem("whylee_sound", soundOn ? "on" : "off");
      soundBtn.textContent = soundOn ? "🔊" : "🔇";
    };
  }

  // --- Notifications toggle ---
  if (notifyBtn) {
    let notifyOn = localStorage.getItem("whylee_notify") !== "off";
    notifyBtn.textContent = `🔔 Notifications: ${notifyOn ? "ON" : "OFF"}`;
    notifyBtn.onclick = async () => {
      notifyOn = !notifyOn;
      localStorage.setItem("whylee_notify", notifyOn ? "on" : "off");
      notifyBtn.textContent = `🔔 Notifications: ${notifyOn ? "ON" : "OFF"}`;
      if (notifyOn && "Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") alert("Notifications disabled in browser.");
      }
    };
  }

  document.body.classList.add("ready");
  console.log("[Whylee Shell] UI loaded");
});
