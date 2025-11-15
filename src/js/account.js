import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase config (same as in main.js)
const firebaseConfig = {
  apiKey: "AIzaSyDtIKg0YwJxgN1S5DaXfWQc27j2pDVaWg0",
  authDomain: "dream-team-7ef8f.firebaseapp.com",
  projectId: "dream-team-7ef8f",
  storageBucket: "dream-team-7ef8f.appspot.com",
  messagingSenderId: "1015778879289",
  appId: "1:1015778879289:web:51a54a49d30a17c99707ea"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Unlock thresholds (same as dashboard.js logic)
const UNLOCK_THRESHOLDS = [
  { points: 120, label: "Premium Player 1" },
  { points: 150, label: "Premium Player 2" },
  { points: 200, label: "Elite Player" }
];

document.addEventListener("DOMContentLoaded", () => {
  // Check auth state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadAccountData(user);
    } else {
      window.location.href = "./login.html";
    }
  });
});

function loadAccountData(user) {
  // Display user email
  document.getElementById("user-email").textContent = user.email;

  // Load user progress from localStorage
  const PROGRESS_KEY = "dt_user_progress_v1";
  let userProgress = { points: 0, wins: 0 };
  
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) userProgress = JSON.parse(raw);
  } catch (e) {
    console.warn("Could not load user progress:", e);
  }

  // Update stats
  document.getElementById("total-points").textContent = userProgress.points;
  document.getElementById("total-wins").textContent = userProgress.wins;

  // Count unlocked players
  const unlockedCount = UNLOCK_THRESHOLDS.filter(t => userProgress.points >= t.points).length;
  document.getElementById("players-unlocked").textContent = unlockedCount;

  // Populate unlocks list
  populateUnlocks(userProgress.points);

  // Show next unlock progress
  showNextUnlockProgress(userProgress.points);
}

function populateUnlocks(currentPoints) {
  const list = document.getElementById("unlocks-list");
  list.innerHTML = "";

  if (UNLOCK_THRESHOLDS.length === 0) {
    list.innerHTML = '<div class="empty-message">No unlocks available yet.</div>';
    return;
  }

  UNLOCK_THRESHOLDS.forEach((unlock, idx) => {
    const isUnlocked = currentPoints >= unlock.points;
    const item = document.createElement("div");
    item.className = `unlock-item ${isUnlocked ? "unlocked" : ""}`;
    
    const icon = isUnlocked ? "🔓" : "🔒";
    const status = isUnlocked 
      ? "Unlocked ✓" 
      : `${unlock.points - currentPoints} points remaining`;

    item.innerHTML = `
      <div>
        <span style="font-size: 1.5rem; margin-right: 1rem;">${icon}</span>
        <span class="name">${unlock.label}</span>
      </div>
      <div class="status">${status}</div>
    `;

    list.appendChild(item);
  });
}

function showNextUnlockProgress(currentPoints) {
  // Find the next locked unlock
  const nextUnlock = UNLOCK_THRESHOLDS.find(t => currentPoints < t.points);

  if (!nextUnlock) {
    // All unlocked
    document.getElementById("next-unlock-label").textContent = "🌟 All Premium Players Unlocked!";
    document.getElementById("next-unlock-fill").style.width = "100%";
    document.getElementById("next-unlock-text").textContent = "100%";
    return;
  }

  const progress = Math.round((currentPoints / nextUnlock.points) * 100);
  const remaining = nextUnlock.points - currentPoints;

  document.getElementById("next-unlock-label").textContent = 
    `${nextUnlock.label} - ${remaining} points remaining`;
  document.getElementById("next-unlock-fill").style.width = `${Math.min(progress, 100)}%`;
  document.getElementById("next-unlock-text").textContent = `${progress}%`;
}

// Reset progress (with confirmation)
window.resetProgress = function() {
  if (confirm("⚠️ Are you sure? This will reset all your progress. This cannot be undone.")) {
    const PROGRESS_KEY = "dt_user_progress_v1";
    localStorage.removeItem(PROGRESS_KEY);
    alert("✅ Progress reset. Reloading...");
    location.reload();
  }
};
