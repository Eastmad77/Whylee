// Whylee · Your Daily Brain Bolt — Clean Build

const CSV_URL = "/questions.csv"; // local guaranteed source
const QUESTION_TIME_MS = 10000;
const QUESTION_TICK_MS = 100;

let questions = [],
    currentIndex = 0,
    score = 0,
    wrongTotal = 0,
    correctSinceLastWrong = 0,
    elapsed = 0,
    elapsedInterval = null,
    qTimer = null,
    qRemaining = QUESTION_TIME_MS,
    qLastTickSec = 3,
    soundOn = true,
    successAutoNav = null;

/* ELEMENTS */
const startBtn = document.getElementById("startBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const shareBtn = document.getElementById("shareBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const qBox = document.getElementById("questionBox");
const choicesDiv = document.getElementById("choices");
const pillScore = document.getElementById("pillScore");
const progressLabel = document.getElementById("progressLabel");
const elapsedTimeEl = document.getElementById("elapsedTime");
const countdownOverlay = document.getElementById("countdownOverlay");
const countNum = document.getElementById("countNum");
const successSplash = document.getElementById("successSplash");
const gameOverBox = document.getElementById("gameOverBox");
const gameOverText = document.getElementById("gameOverText");
const timerBar = document.getElementById("timerBar");
const qTimerBar = document.getElementById("qTimerBar");
const soundBtn = document.getElementById("soundBtn");
const setLabel = document.getElementById("setLabel");
const streakVis = document.getElementById("streakVis");

/* HELPERS */
const setText = (el, txt) => { if (el) el.textContent = txt; };
const show = (el, on=true) => { if (el) el.style.display = on ? "" : "none"; };

/* --- WHYLEE POSTER SPLASH --- */
const startSplash = document.getElementById("startSplash");
const splashTap = document.getElementById("splashTap");

function hideSplash(){
  if (!startSplash) return;
  startSplash.style.transition = "opacity .3s";
  startSplash.style.opacity = "0";
  setTimeout(() => startSplash.remove(), 320);
}

document.addEventListener("DOMContentLoaded", () => {
  if (countdownOverlay) countdownOverlay.hidden = true;
});

if (splashTap) {
  splashTap.addEventListener("click", () => {
    hideSplash();
    startGame();
  }, { passive: true });
}

/* AUDIO */
function beep(f=600,d=.25){}

/* CSV LOADING */
function fetchCSV(){
  return fetch(CSV_URL)
    .then(r => r.text())
    .then(text => {
      const rows = text.split("\n").map(r => r.split(","));
      return rows.slice(1).map(row => ({
        Question: row[0],
        OptionA: row[1],
        OptionB: row[2],
        OptionC: row[3],
        OptionD: row[4],
        Answer: row[5]
      }));
    });
}

/* TIMER */
function startQuestionTimer(onTimeout){
  stopQuestionTimer();
  qRemaining = QUESTION_TIME_MS;

  qTimer = setInterval(() => {
    qRemaining -= QUESTION_TICK_MS;

    const pct = Math.max(0, qRemaining / QUESTION_TIME_MS) * 100;
    timerBar.style.width = pct + "%";

    if (qRemaining <= 0){
      stopQuestionTimer();
      onTimeout?.();
    }
  }, QUESTION_TICK_MS);
}

function stopQuestionTimer(){
  if (qTimer){
    clearInterval(qTimer);
    qTimer = null;
  }
}

/* START GAME */
async function startGame(){
  try{
    setText(setLabel, "Loading…");

    const data = await fetchCSV();
    questions = data.slice(0, 12);

    currentIndex = 0;
    score = 0;
    wrongTotal = 0;

    setText(pillScore, "Score 0");
    setText(progressLabel, "Q 0/12");
    show(gameOverBox, false);

    beginQuiz();
  }catch(e){
    setText(qBox, "Could not load quiz.");
  }
}

/* QUIZ */
function beginQuiz(){
  elapsed = 0;
  setText(elapsedTimeEl, "0:00");

  clearInterval(elapsedInterval);
  elapsedInterval = setInterval(() => {
    elapsed++;
    setText(elapsedTimeEl,
      `${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,"0")}`
    );
  }, 1000);

  showQuestion();
}

function showQuestion(){
  if (currentIndex >= questions.length) return endGame();

  const q = questions[currentIndex];
  setText(qBox, q.Question);

  const opts = [
    { text: q.OptionA, isCorrect: q.Answer === q.OptionA },
    { text: q.OptionB, isCorrect: q.Answer === q.OptionB },
    { text: q.OptionC, isCorrect: q.Answer === q.OptionC },
    { text: q.OptionD, isCorrect: q.Answer === q.OptionD }
  ].filter(o => o.text);

  choicesDiv.innerHTML = "";

  opts.forEach(o => {
    const b = document.createElement("button");
    b.textContent = o.text;
    b.onclick = () => handleAnswer(b, o.isCorrect);
    choicesDiv.appendChild(b);
  });

  setText(progressLabel, `Q ${currentIndex+1}/12`);

  startQuestionTimer(() => handleTimeout());
}

function handleTimeout(){
  wrongTotal++;
  advanceOrEnd();
}

function handleAnswer(btn, correct){
  stopQuestionTimer();
  [...choicesDiv.querySelectorAll("button")].forEach(b => b.disabled = true);

  if (correct){
    btn.classList.add("correct");
    score++;
    setText(pillScore, `Score ${score}`);
  } else {
    btn.classList.add("incorrect");
    wrongTotal++;
  }

  setTimeout(() => advanceOrEnd(), 700);
}

function advanceOrEnd(){
  if (wrongTotal >= 3) return endGame("3 incorrect — game over!");
  currentIndex++;
  showQuestion();
}

function endGame(msg=""){
  stopQuestionTimer();
  clearInterval(elapsedInterval);

  if (msg){
    show(gameOverBox, true);
    setText(gameOverText, msg);
  } else {
    successSplash.style.display = "";
    setTimeout(() => successSplash.style.display = "none", 2000);
  }
}

/* BUTTONS */
startBtn?.addEventListener("click", startGame);
playAgainBtn?.addEventListener("click", startGame);
soundBtn?.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "🔊" : "🔇";
});
