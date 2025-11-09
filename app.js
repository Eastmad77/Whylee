// ===== Whylee — app.js v6.001 (levels + poster flow + local CSV) =====

// RELIABLE MVP SOURCE: local CSV (can add Sheets fallback later)
const CSV_URL = "/questions.csv";

// Level → per-question time (ms)
const TIME_PER_LEVEL = { 1: 10000, 2: 20000, 3: 40000 };

// Elements
const startBtn = document.getElementById("startBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const shareBtn = document.getElementById("shareBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const qBox = document.getElementById("questionBox");
const choicesDiv = document.getElementById("choices");
const pillScore = document.getElementById("pillScore");
const progressLabel = document.getElementById("progressLabel");
const elapsedTimeEl = document.getElementById("elapsedTime");
const successSplash = document.getElementById("successSplash"); // not used now
const gameOverBox = document.getElementById("gameOverBox");
const gameOverText = document.getElementById("gameOverText");
const timerBar = document.getElementById("timerBar");
const qTimerBar = document.getElementById("qTimerBar");
const soundBtn = document.getElementById("soundBtn");
const setLabel = document.getElementById("setLabel");
const streakVis = document.getElementById("streakVis");
const levelSelect = document.getElementById("levelSelect");

// Posters
const posterSplash = document.getElementById("posterSplash"); // start
const interPoster = document.getElementById("interPoster");
const interPosterImg = document.getElementById("interPosterImg");

// State
let soundOn = true;
let questions = [];
let currentIndex = 0;
let score = 0, wrongTotal = 0, correctSinceLastWrong = 0;
let elapsed = 0, elapsedInterval = null, qTimer = null, qRemaining = 0, qLastTickSec = 3;
let selectedLevel = 1;
let sessionLevel = 1; // advances 1→2→3 during a “run”

// Helpers
const setText = (el, txt) => { if (el) el.textContent = txt; };
const setStyle = (el, p, v) => { if (el && el.style) el.style[p] = v; };
const show = (el, on = true) => { if (el) el.style.display = on ? "" : "none"; };
const addCls = (el, c) => { if (el) el.classList.add(c); };
const remCls = (el, c) => { if (el) el.classList.remove(c); };
function formatTime(s){const m=Math.floor(s/60),x=s%60;return `${m}:${x<10?"0":""}${x}`;}
function shuffleArray(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const norm = (x)=>String(x??"").trim().toLowerCase();

// Audio
function beep(f=600,d=.25){ if(!soundOn) return; try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.type="sine"; o.frequency.value=f; o.connect(g); g.connect(ctx.destination); g.gain.value=.25; const t=ctx.currentTime; o.start(t); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.stop(t+d+.02);}catch{} }
const beepTick=()=>beep(620,.22), beepGo=()=>beep(950,.28), sfxCorrect=()=>beep(1020,.18), sfxIncorrect=()=>beep(220,.2), tickSoft=()=>beep(740,.08);
function vibrate(ms=100){ if(navigator.vibrate) navigator.vibrate(ms); }

// CSV
function fetchCSV(){
  return new Promise((resolve,reject)=>{
    Papa.parse(CSV_URL,{download:true,header:true,skipEmptyLines:true,complete:r=>resolve(r.data||[]),error:e=>reject(e)});
  });
}

// Row validity + correct resolver (reused from prior build)
function resolveCorrectText(q){ if(!q) return ""; const Q=k=>q[k]??q[k?.toLowerCase?.()]??q[k?.toUpperCase?.()]; const ans=norm(Q("Answer")); const M={a:"OptionA",b:"OptionB",c:"OptionC",d:"OptionD"}; if(["a","b","c","d"].includes(ans)) return Q(M[ans])??""; if(["optiona","optionb","optionc","optiond"].includes(ans)){const k="Option"+ans.slice(-1).toUpperCase(); return Q(k)??"";} return Q("Answer")??""; }
function isValidRow(row){ if(!row) return false; const get=k=>row[k]??row[k?.toLowerCase?.()]??row[k?.toUpperCase?.()]; const hasQ=!!norm(get("Question")); const opts=["OptionA","OptionB","OptionC","OptionD"].map(get).filter(Boolean); return hasQ&&opts.length>=2; }
function filterByLevel(rows, level){ return rows.filter(row => String(row.Level ?? row.level ?? "").trim() === String(level)); }

// Streak (12 pips)
function buildStreakBar(){ if(!streakVis) return; streakVis.innerHTML=""; for(let i=0;i<12;i++){const d=document.createElement("div"); d.className="streak-dot"; d.dataset.index=i; streakVis.appendChild(d);} }
function markStreak(i,ok){ const d=streakVis?.querySelector(`.streak-dot[data-index="${i}"]`); if(!d) return; remCls(d,"is-correct"); remCls(d,"is-wrong"); addCls(d, ok?"is-correct":"is-wrong"); }
function redeemOneWrongDot(){ if(!streakVis) return; const wrongs=[...streakVis.querySelectorAll(".streak-dot.is-wrong")]; if(!wrongs.length) return; let target=wrongs.reverse().find(d=>Number(d.dataset.index)<currentIndex)||wrongs[0]; target.classList.add("redeem"); setTimeout(()=>{target.classList.remove("is-wrong","redeem");},900); }

// Posters
function showPoster(kind){
  const map = {
    start: "/poster-01-start.jpg",
    level2: "/poster-level2.jpg",
    level3: "/poster-06-challenge.jpg",
    gameover: "/poster-gameover.jpg",
    success: "/poster-night.jpg",
    tomorrow: "/poster-night.jpg",
  };
  if (kind === "start") {
    posterSplash?.classList.add("show");
    posterSplash?.setAttribute("data-kind","start");
    return;
  }
  if (!interPoster || !interPosterImg) return;
  interPosterImg.src = map[kind] || map.success;
  interPoster.setAttribute("data-kind", kind);
  interPoster.classList.add("show");
  interPoster.removeAttribute("aria-hidden");
}
function hidePosters(){
  posterSplash?.classList.remove("show");
  interPoster?.classList.remove("show");
  interPoster?.setAttribute("aria-hidden","true");
}

// Timers
function startQuestionTimer(onTimeout){
  stopQuestionTimer();
  const perQ = TIME_PER_LEVEL[sessionLevel] || TIME_PER_LEVEL[1];
  qRemaining = perQ; qLastTickSec = 3;
  qTimerBar?.classList.remove("warn"); setStyle(qTimerBar,"width","100%");
  qTimer = setInterval(()=>{
    qRemaining -= 100;
    const pct = Math.max(0, qRemaining/(perQ))*100; setStyle(qTimerBar,"width",pct+"%");
    const secsLeft = Math.ceil(qRemaining/1000);
    if(qRemaining<=3000){ qTimerBar?.classList.add("warn"); if(secsLeft>0 && secsLeft<qLastTickSec+1){ tickSoft(); qLastTickSec=secsLeft; } }
    if(qRemaining<=0){ stopQuestionTimer(); onTimeout?.(); }
  },100);
}
function stopQuestionTimer(){ if(qTimer){ clearInterval(qTimer); qTimer=null; } }

// Game flow
async function startGame(level){
  try{
    hidePosters();
    setText(setLabel,"Loading…");
    const data=await fetchCSV();
    const pool=filterByLevel(data, level).filter(isValidRow);
    if(!pool.length) throw new Error("No valid questions for this level");
    questions=shuffleArray(pool).slice(0,12);
    currentIndex=0; score=0; wrongTotal=0; correctSinceLastWrong=0; elapsed=0; sessionLevel=level;
    setText(pillScore,"Score 0"); setText(progressLabel,"Q 0/12"); show(gameOverBox,false); show(playAgainBtn,false);
    setText(setLabel,`Level ${sessionLevel}`);
    buildStreakBar();
    beginQuiz();
  }catch(e){
    setText(qBox,"Could not load questions. Please try again.");
    setText(setLabel,"Error"); console.error(e);
  }
}
function beginQuiz(){
  elapsed=0; setText(elapsedTimeEl,"0:00"); setStyle(timerBar,"width","0%");
  clearInterval(elapsedInterval);
  elapsedInterval=setInterval(()=>{ elapsed++; setText(elapsedTimeEl,formatTime(elapsed)); setStyle(timerBar,"width",Math.min(100,(elapsed/300)*100)+"%"); },1000);
  showQuestion();
}
function showQuestion(){
  if(!Array.isArray(questions)||currentIndex>=questions.length) return endLevel();
  const q=questions[currentIndex]; if(!q){ currentIndex++; return showQuestion(); }
  const Q=k=>q[k]??q[k?.toLowerCase?.()]??q[k?.toUpperCase?.()];
  const correctText=resolveCorrectText(q);
  setText(qBox,Q("Question")||"—"); choicesDiv.innerHTML="";
  let opts=[]; ["OptionA","OptionB","OptionC","OptionD"].forEach(k=>{const v=Q(k); if(!v) return; const ok=norm(v)===norm(correctText); opts.push({text:String(v),isCorrect:ok});});
  if(!opts.some(o=>o.isCorrect)&&opts.length>0) opts[0].isCorrect=true;
  if(opts.length<2){ currentIndex++; return showQuestion(); }
  opts=shuffleArray(opts);
  opts.forEach(o=>{ const b=document.createElement("button"); b.textContent=o.text; b.onclick=()=>handleAnswer(b,o.isCorrect); choicesDiv.appendChild(b); });
  setText(progressLabel,`Q ${Math.min(currentIndex+1,12)}/12`);
  startQuestionTimer(()=>handleTimeout());
}
function handleTimeout(){ sfxIncorrect(); vibrate(160); registerWrong(); advanceOrEnd(); }
function handleAnswer(btn,isCorrect){
  stopQuestionTimer(); [...choicesDiv.querySelectorAll("button")].forEach(b=>b.disabled=true);
  if(isCorrect){ addCls(btn,"correct"); sfxCorrect(); vibrate(60); score++; setText(pillScore,`Score ${score}`); registerCorrect(); }
  else{ addCls(btn,"incorrect"); sfxIncorrect(); vibrate(160); registerWrong(); }
  setTimeout(()=>advanceOrEnd(),800);
}
function registerCorrect(){ markStreak(currentIndex,true); correctSinceLastWrong++; if(correctSinceLastWrong>=3 && wrongTotal>0){ redeemOneWrongDot(); wrongTotal--; correctSinceLastWrong=0; } }
function registerWrong(){ markStreak(currentIndex,false); wrongTotal++; correctSinceLastWrong=0; }
function advanceOrEnd(){ if(wrongTotal>=3) return endGame("3 incorrect — game over!"); currentIndex++; if(currentIndex>=12) endLevel(); else showQuestion(); }

// Level end → move to poster or final end
function endLevel(){
  clearInterval(elapsedInterval); stopQuestionTimer();
  if (sessionLevel === 1) { showPoster("level2"); return; }
  if (sessionLevel === 2) { showPoster("level3"); return; }
  // finished level 3
  showPoster("tomorrow");
}

function endGame(msg=""){
  clearInterval(elapsedInterval); stopQuestionTimer();
  if(msg){
    setText(gameOverText,msg); show(gameOverBox,true); show(playAgainBtn,true);
    showPoster("gameover");
  }
}

// UI wiring
startBtn?.addEventListener("click",()=>{
  selectedLevel = Number(levelSelect?.value||1) || 1;
  startGame(selectedLevel);
});
shuffleBtn?.addEventListener("click",()=>{ shuffleArray(questions); currentIndex=0; wrongTotal=0; correctSinceLastWrong=0; buildStreakBar(); showQuestion(); });
shareBtn?.addEventListener("click",()=>{ const text=`I'm playing Whylee! Current score: ${score}/12`; if(navigator.share) navigator.share({title:"Whylee",text,url:location.href}).catch(()=>{}); else navigator.clipboard?.writeText(`${text} - ${location.href}`); });
playAgainBtn?.addEventListener("click",()=>{ selectedLevel = Number(levelSelect?.value||1) || 1; startGame(selectedLevel); });
soundBtn?.addEventListener("click",()=>{ soundOn=!soundOn; soundBtn.textContent=soundOn?"🔊":"🔇"; });

// Poster taps
posterSplash?.addEventListener("click",()=>{ posterSplash.classList.remove("show"); });
interPoster?.addEventListener("click",()=>{
  const kind = interPoster.getAttribute("data-kind");
  interPoster.classList.remove("show");
  if (kind==="level2") startGame(2);
  else if (kind==="level3") startGame(3);
  else if (kind==="tomorrow" || kind==="success" || kind==="gameover") {
    // Reset UI to start
    setText(qBox,"Tap the poster to begin");
    buildStreakBar(); setText(pillScore,"Score 0"); setText(progressLabel,"Q 0/12");
  }
});

// Boot with start poster visible
document.addEventListener("DOMContentLoaded", ()=> {
  buildStreakBar();
  showPoster("start");
});
