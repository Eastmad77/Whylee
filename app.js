/**
 * Whylee - app.js v2025.11
 * ------------------------------------------------
 * Loads questions dynamically from API or fallback CSV.
 * Supports 3 difficulty levels with auto-timers.
 */

const TIME_PER_LEVEL = { 1: 10000, 2: 20000, 3: 40000 };
let selectedLevel = 1;
let questions = [];
let currentIndex = 0;
let score = 0;
let strikes = 0;
let timerInterval;
let qRemaining = 0;

// --- Level selector ---
const levelSelect = document.getElementById("levelSelect");
if (levelSelect) {
  levelSelect.addEventListener("change", () => {
    selectedLevel = Number(levelSelect.value) || 1;
  });
}

// --- Fetch Questions (AI or fallback) ---
async function fetchCSV() {
  const primary = "/api/questions";
  const fallback = "/questions.csv";
  try {
    const res = await fetch(primary, { cache: "no-store" });
    if (!res.ok) throw new Error("Primary source failed");
    const text = await res.text();
    console.log("✅ Loaded daily AI questions");
    return Papa.parse(text, { header: true }).data;
  } catch (err) {
    console.warn("⚠️ Using fallback CSV:", err);
    const res2 = await fetch(fallback);
    const text2 = await res2.text();
    return Papa.parse(text2, { header: true }).data;
  }
}

// --- Utilities ---
function shuffleArray(arr) {
  return arr
    .map((v) => ({ v, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ v }) => v);
}

function filterByLevel(rows, level) {
  return rows.filter((r) => String(r.Level || "").trim() === String(level));
}

// --- Game flow ---
async function startGame() {
  document.getElementById("startBtn").disabled = true;
  const data = await fetchCSV();
  const pool = filterByLevel(data, selectedLevel);
  if (!pool.length) {
    alert("No questions available for this level. Try again later!");
    return;
  }

  questions = shuffleArray(pool).slice(0, 12);
  score = 0;
  strikes = 0;
  currentIndex = 0;
  nextQuestion();
}

function nextQuestion() {
  if (currentIndex >= questions.length) return gameSuccess();

  const q = questions[currentIndex];
  const qBox = document.getElementById("questionBox");
  const cBox = document.getElementById("choices");
  qBox.textContent = q.Question;
  cBox.innerHTML = "";

  ["OptionA", "OptionB", "OptionC", "OptionD"].forEach((key) => {
    if (!q[key]) return;
    const btn = document.createElement("button");
    btn.textContent = q[key];
    btn.className = "choice-btn";
    btn.onclick = () => checkAnswer(q, q[key]);
    cBox.appendChild(btn);
  });

  startQuestionTimer(nextQuestion);
}

function checkAnswer(q, choice) {
  stopQuestionTimer();
  const correct = choice.trim().toLowerCase() === q.Answer.trim().toLowerCase();
  if (correct) {
    score++;
  } else {
    strikes++;
  }
  currentIndex++;
  updateHUD();

  if (strikes >= 3) return gameOver();
  if (currentIndex >= questions.length) return gameSuccess();

  nextQuestion();
}

function updateHUD() {
  document.getElementById("pillScore").textContent = `Score ${score}`;
  document.getElementById("progressLabel").textContent = `Q ${currentIndex}/${questions.length}`;
}

// --- Timer logic ---
function startQuestionTimer(onTimeout) {
  stopQuestionTimer();
  const bar = document.getElementById("qTimerBar");
  const total = TIME_PER_LEVEL[selectedLevel];
  const start = Date.now();

  timerInterval = setInterval(() => {
    const elapsed = Date.now() - start;
    const pct = Math.max(0, 1 - elapsed / total);
    bar.style.width = pct * 100 + "%";
    if (elapsed >= total) {
      clearInterval(timerInterval);
      strikes++;
      currentIndex++;
      updateHUD();
      if (strikes >= 3) gameOver();
      else onTimeout();
    }
  }, 100);
}

function stopQuestionTimer() {
  clearInterval(timerInterval);
}

// --- End states ---
function gameOver() {
  stopQuestionTimer();
  document.getElementById("questionBox").textContent = "💀 Game Over";
  document.getElementById("choices").innerHTML = "";
  document.getElementById("startBtn").disabled = false;
}

function gameSuccess() {
  stopQuestionTimer();
  document.getElementById("questionBox").textContent = "🏆 Success! See you tomorrow!";
  document.getElementById("choices").innerHTML = "";
  document.getElementById("startBtn").disabled = false;
}

// --- Bind Start button ---
document.getElementById("startBtn").addEventListener("click", startGame);
