/**
 * Whylee Shell — UI helpers & navigation logic
 * Handles menu toggles, sound control, and persistent settings
 */

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("mmMenuBtn");
  const sideMenu = document.getElementById("mmSideMenu");
  const soundBtn = document.getElementById("soundBtn");
  const notifyBtn = document.getElementById("notifyItem");

  // ----- Menu Toggle -----
  if (menuBtn && sideMenu) {
    menuBtn.addEventListener("click", () => {
      const open = sideMenu.getAttribute("aria-hidden") === "false";
      sideMenu.setAttribute("aria-hidden", open ? "true" : "false");
      sideMenu.classList.toggle("open", !open);
    });
  }

  // ----- Sound Toggle -----
  let soundOn = localStorage.getItem("whylee_sound") !== "off";
  updateSoundIcon();

  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      soundOn = !soundOn;
      localStorage.setItem("whylee_sound", soundOn ? "on" : "off");
      updateSoundIcon();
    });
  }

  function updateSoundIcon() {
    if (soundBtn) soundBtn.textContent = soundOn ? "🔊" : "🔇";
  }

  // ----- Notification Toggle -----
  let notifyOn = localStorage.getItem("whylee_notify") !== "off";
  updateNotifyLabel();

  if (notifyBtn) {
    notifyBtn.addEventListener("click", async () => {
      notifyOn = !notifyOn;
      localStorage.setItem("whylee_notify", notifyOn ? "on" : "off");
      updateNotifyLabel();

      if (notifyOn && "Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          alert("Notifications are disabled in browser settings.");
        }
      }
    });
  }

  function updateNotifyLabel() {
    if (notifyBtn)
      notifyBtn.textContent = `🔔 Notifications: ${notifyOn ? "ON" : "OFF"}`;
  }

  // ----- Theme Initialization -----
  document.body.classList.add("ready");
  console.log("[Whylee Shell] UI loaded");
});
