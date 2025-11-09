/**
 * Whylee App Core v7.1
 * Handles game logic, question fetching, posters, and timers
 */

const API_URL = "/.netlify/functions/questions";
const LEVELS = { 1: "Quick Fire", 2: "Pattern Solve", 3: "Challenge" };

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Whylee] App initialising...");
  initApp();
});

async function initApp() {
  const qBox = document.getElementById("questionBox");
  const startBtn = document.getElementById("startBtn");
  const posterOverlay = document.getElementById("posterOverlay");
  const posterTap = document.getElementById("posterTap");
  const posterImg = document.getElementById("posterImg");
  const levelSelect = document.getElementById("levelSelect");

  startBtn.addEventListener("click", startGame);
  posterTap.addEventListener("click", hidePoster);

  async function startGame() {
    console.log("Starting game...");
    showPoster("/poster-01-start.jpg");
    await loadQuestions();
  }

  function showPoster(src) {
    posterImg.src = src;
    posterOverlay.classList.remove("hidden");
    posterOverlay.classList.add("show");
  }

  function hidePoster() {
    posterOverlay.classList.add("hidden");
    posterOverlay.classList.remove("show");
  }

  async function loadQuestions() {
    try {
      const res = await fetch(API_URL);
      const csv = await res.text();
      const rows = Papa.parse(csv, { header: true }).data;
      console.log("✅ Loaded daily AI questions", window.location.origin);
      qBox.textContent = `Level ${levelSelect.value}: ${LEVELS[levelSelect.value]} — ${rows.length} questions ready`;
    } catch (err) {
      console.error("❌ Failed to load questions", err);
      qBox.textContent = "Error loading questions. Try again later.";
    }
  }
}
