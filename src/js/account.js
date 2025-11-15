// Reuse the project's Firebase app instance initialized in the repo root
import { app, db, storage } from "../../firebase.js";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const auth = getAuth(app);

// Unlock thresholds (same as dashboard.js logic)
const UNLOCK_THRESHOLDS = [
  { points: 120, label: "Premium Player 1" },
  { points: 150, label: "Premium Player 2" },
  { points: 200, label: "Elite Player" }
];

// Simple toast helper (global within this module)
function showToast(message, type = "info", ms = 3500) {
  const root = document.getElementById("toast-root");
  if (!root) {
    // fallback to alert if toast root missing
    alert(message);
    return;
  }
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = message;
  root.appendChild(t);
  // animate in
  requestAnimationFrame(() => {
    t.style.opacity = "1";
    t.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateY(8px)";
    setTimeout(() => t.remove(), 300);
  }, ms);
}

document.addEventListener("DOMContentLoaded", () => {
  // Check auth state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadAccountData(user);
      initProfileControls(user);
    } else {
      window.location.href = "./login.html";
    }
  });
});

async function loadAccountData(user) {
  // Display user email
  document.getElementById("user-email").textContent = user.email;

  // Populate profile fields if present
  const displayInput = document.getElementById("display-name-input");
  const usernameInput = document.getElementById("username-input");
  const profileImg = document.getElementById("profile-img");
  const fullNameDisplay = document.getElementById("full-name-display");

  if (displayInput) displayInput.value = user.displayName || "";
  if (fullNameDisplay) fullNameDisplay.textContent = user.displayName || "";
  const emailInput = document.getElementById("email-input");
  if (emailInput) emailInput.value = user.email || "";

  // username: load from Firestore if present
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc && userDoc.exists()) {
      const data = userDoc.data();
      if (usernameInput) usernameInput.value = data.username || "";
      // show password last changed if available
      const pwdInfo = document.getElementById("password-info");
      if (pwdInfo) {
        if (data.passwordLastChanged && data.passwordLastChanged.toDate) {
          const d = data.passwordLastChanged.toDate();
          pwdInfo.textContent = `Password: •••••••• (last changed ${d.toLocaleString()})`;
        } else {
          pwdInfo.textContent = `Password: ••••••••`;
        }
      }
    } else {
      const storedUsername = localStorage.getItem("dt_username");
      if (usernameInput) usernameInput.value = storedUsername || "";
    }
  } catch (err) {
    // Surface the error to the user while keeping the fallback behavior
    console.error("Could not load username from Firestore:", err);
    showToast("Could not load server profile data. Falling back to local data.", 'warning', 5000);
    const storedUsername = localStorage.getItem("dt_username");
    if (usernameInput) usernameInput.value = storedUsername || "";
  }

  // profile image: prefer Firebase photoURL if available
  if (profileImg) profileImg.src = user.photoURL || "./images/default-avatar.png";

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
    showToast("✅ Progress reset. Reloading...", 'success');
    location.reload();
  }
};

// Initialize profile controls: photo upload, save profile, change password
function initProfileControls(user) {
  const photoInput = document.getElementById("profile-photo-input");
  const profileImg = document.getElementById("profile-img");
  const saveBtn = document.getElementById("save-profile-btn");
  const displayInput = document.getElementById("display-name-input");
  const usernameInput = document.getElementById("username-input");

  if (photoInput) {
    photoInput.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!user || !user.uid) { showToast("You must be signed in to upload a profile photo.", 'error'); return; }

      const path = `avatars/${user.uid}/${Date.now()}_${file.name}`;
      const r = storageRef(storage, path);
      try {
        const snap = await uploadBytes(r, file);
        const downloadURL = await getDownloadURL(snap.ref);
        if (profileImg) profileImg.src = downloadURL;
        // store pending photo URL on the input element for save flow
        photoInput.dataset.pendingUrl = downloadURL;
      } catch (err) {
        console.error("Upload failed:", err);
        showToast("Could not upload photo. Try again later.", 'error');
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const newDisplay = displayInput ? displayInput.value.trim() : "";
      const newUsername = usernameInput ? usernameInput.value.trim() : "";
      const emailInput = document.getElementById("email-input");
      const reauthInput = document.getElementById("reauth-password");
      const newEmail = emailInput ? emailInput.value.trim() : user.email;
      const pendingPhotoUrl = photoInput ? photoInput.dataset.pendingUrl : null;

      try {
        // If email changed, require reauthentication (password provider only)
        const hasPasswordProvider = user.providerData && user.providerData.some(p => p.providerId === 'password');
        if (newEmail && newEmail !== user.email) {
          if (!hasPasswordProvider) {
            showToast('Your account uses a third-party provider (Google, etc.). Change your email through that provider.', 'error');
            return;
          }

          const reauthPwd = reauthInput && reauthInput.value ? reauthInput.value : prompt('To change your email please enter your current password:');
          if (!reauthPwd) { showToast('Email change requires your current password to confirm.', 'error'); return; }

          // Reauthenticate then update email
          const credential = EmailAuthProvider.credential(user.email, reauthPwd);
          await reauthenticateWithCredential(user, credential);
          await updateEmail(user, newEmail);
        }

        // update Firebase displayName and photoURL (use uploaded storage URL if present)
        await updateProfile(user, {
          displayName: newDisplay || user.displayName,
          photoURL: pendingPhotoUrl || user.photoURL || null,
        });

        // store username in Firestore under users/{uid}
        if (newUsername) {
          try {
            await setDoc(doc(db, "users", user.uid), { username: newUsername }, { merge: true });
          } catch (err) {
            console.warn("Could not save username to Firestore:", err);
            // fallback to localStorage
            localStorage.setItem("dt_username", newUsername);
          }
        }

        showToast("Profile updated successfully.", 'success');
        // reflect changes
        document.getElementById("user-email").textContent = user.email;
      } catch (err) {
        console.error("Error updating profile:", err);
        showToast(err.message || "Could not update profile.", 'error');
      }
    });
  }

  // Change password flow
  const changePassBtn = document.getElementById("change-password-btn");
  if (changePassBtn) {
    // If account is not password-based, disable password change
    const isPasswordProvider = user.providerData && user.providerData.some(p => p.providerId === 'password');
    const currentPassInput = document.getElementById("current-password");
    if (!isPasswordProvider) {
      changePassBtn.disabled = true;
      changePassBtn.title = "Password managed by provider; cannot change here.";
      if (currentPassInput) currentPassInput.disabled = true;
    }
    changePassBtn.addEventListener("click", async () => {
      const current = document.getElementById("current-password").value;
      const next = document.getElementById("new-password").value;
      const confirm = document.getElementById("confirm-new-password").value;

      if (!current || !next) { showToast("Please fill current and new password fields.", 'error'); return; }
      if (next.length < 6) { showToast("New password must be at least 6 characters.", 'error'); return; }
      if (next !== confirm) { showToast("New password and confirmation do not match.", 'error'); return; }

      try {
        const credential = EmailAuthProvider.credential(user.email, current);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, next);
        // record password change time in Firestore for this user
        try {
          await setDoc(doc(db, "users", user.uid), { passwordLastChanged: serverTimestamp() }, { merge: true });
        } catch (err) {
          console.warn("Could not record password change time:", err);
        }
        showToast("Password changed successfully.", 'success');
        // clear inputs
        document.getElementById("current-password").value = "";
        document.getElementById("new-password").value = "";
        document.getElementById("confirm-new-password").value = "";
      } catch (err) {
        console.error("Password change error:", err);
        showToast(err.message || "Could not change password. Make sure current password is correct.", 'error');
      }
    });
  }
}
