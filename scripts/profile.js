// /scripts/profile.js (v9007)
// Manages profile avatar + emoji selection and saves user state to Firestore.

import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  onAuthStateChanged
} from "/scripts/firebase-bridge.js?v=9007";

import { isPro } from "/scripts/entitlements.js?v=9007";

// Avatar catalogue definition (hand-maintained or built automatically)
const AVATAR_SPEC_URL = "/media/avatars/avatars.json"; // JSON of { id, name, img, pro: boolean }

const EMOJIS = ["🦊", "🦉", "🐼", "🐱", "🐯", "🐺", "🐲", "🐻", "⭐", "⚡", "🔥", "💫", "🌟", "🏆", "🎯"];

const els = {
  grid: document.getElementById("profileAvatarGrid"),
  emoji: document.getElementById("profileEmojiGrid"),
  save: document.getElementById("profileSaveBtn"),
  status: document.getElementById("profileSaveStatus"),
};

let state = {
  uid: null,
  isPro: false,
  current: { avatarId: "fox-default", emoji: "🦊" },
  catalogue: [],
};

// ---------------------------
//  UI helper
// ---------------------------

function lockTag() {
  return `
    <span class="ava-lock" title="Whylee Pro">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 016 0v3z"/>
      </svg>
      Pro
    </span>`;
}

// ---------------------------
//  Data loading + rendering
// ---------------------------

async function fetchCatalogue() {
  const res = await fetch(AVATAR_SPEC_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${AVATAR_SPEC_URL}`);
  state.catalogue = await res.json();
}

function renderAvatars() {
  const { catalogue, current, isPro } = state;
  els.grid.innerHTML = catalogue
    .map(a => {
      const locked = a.pro && !isPro;
      return `
        <button class="ava-card ${current.avatarId === a.id ? "selected" : ""}"
          data-id="${a.id}"
          ${locked ? 'data-locked="1"' : ""}
          aria-pressed="${current.avatarId === a.id}">
          <img class="ava-img" src="${a.img}" alt="${a.name}">
          <div class="ava-name">${a.name}</div>
          ${locked ? lockTag() : ""}
        </button>
      `;
    })
    .join("");
}

function renderEmojis() {
  const { current } = state;
  els.emoji.innerHTML = EMOJIS.map(e => `
    <button class="emoji-card ${current.emoji === e ? "selected" : ""}"
      data-emoji="${e}"
      aria-pressed="${current.emoji === e}">
      <span>${e}</span>
    </button>
  `).join("");
}

// ---------------------------
//  Event handlers
// ---------------------------

function wireEvents() {
  els.grid?.addEventListener("click", (e) => {
    const btn = e.target.closest(".ava-card");
    if (!btn) return;
    if (btn.dataset.locked === "1") {
      els.status.textContent = "That avatar is a Whylee Pro bonus.";
      return;
    }
    state.current.avatarId = btn.dataset.id;
    renderAvatars();
    els.status.textContent = "";
  });

  els.emoji?.addEventListener("click", (e) => {
    const btn = e.target.closest(".emoji-card");
    if (!btn) return;
    state.current.emoji = btn.dataset.emoji;
    renderEmojis();
  });

  els.save?.addEventListener("click", saveProfile);
}

// ---------------------------
//  Firestore integration
// ---------------------------

async function loadUserDoc(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const d = snap.data();
    state.current.avatarId = d.avatarId || state.current.avatarId;
    state.current.emoji = d.emoji || state.current.emoji;
  }
}

async function saveProfile() {
  if (!state.uid) return;
  els.save.disabled = true;
  els.status.textContent = "Saving…";

  const ref = doc(db, "users", state.uid);
  await setDoc(ref, {
    avatarId: state.current.avatarId,
    emoji: state.current.emoji,
    updatedAt: Date.now(),
  }, { merge: true });

  els.save.disabled = false;
  els.status.textContent = "Saved ✓";
  setTimeout(() => (els.status.textContent = ""), 1500);
}

// ---------------------------
//  Boot logic
// ---------------------------

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/signin.html";
    return;
  }
  try {
    state.uid = user.uid;
    await fetchCatalogue();
    await loadUserDoc(user.uid);
    state.isPro = await isPro(user.uid);
    renderAvatars();
    renderEmojis();
    wireEvents();
  } catch (err) {
    console.error("[profile] boot error:", err);
    els.status.textContent = "Failed to load profile.";
  }
});
