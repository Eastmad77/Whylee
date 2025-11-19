document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("mmMenuBtn");
  const sideMenu = document.getElementById("mmSideMenu");
  const notifyItem = document.getElementById("notifyItem");

  function openMenu(){
    sideMenu.classList.add("open");
    sideMenu.setAttribute("aria-hidden","false");
  }

  function closeMenu(){
    sideMenu.classList.remove("open");
    sideMenu.setAttribute("aria-hidden","true");
  }

  menuBtn?.addEventListener("click", (e)=>{
    e.stopPropagation();
    sideMenu.classList.contains("open") ? closeMenu() : openMenu();
  });

  document.addEventListener("click", (e)=>{
    if (!sideMenu.contains(e.target)) closeMenu();
  });

  notifyItem?.addEventListener("click",()=>{
    const off = notifyItem.textContent.includes("OFF");
    notifyItem.textContent = off ? "🔔 Notifications: ON" : "🔕 Notifications: OFF";
  });

  /* Service Worker */
  if ("serviceWorker" in navigator){
    navigator.serviceWorker.register("/service-worker.js?v=5101")
      .catch(()=>{});
  }
});
