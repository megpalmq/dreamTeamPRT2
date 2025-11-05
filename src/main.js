import "./scss/styles.scss";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC74Yy1umbex7FlZbo3WLb9Skr3YRyDGDA",
  authDomain: "n423-6048d.firebaseapp.com",
  projectId: "n423-6048d",
  storageBucket: "n423-6048d.firebasestorage.app",
  messagingSenderId: "358545178901",
  appId: "1:358545178901:web:19ce544398e43bb601e91c",
  measurementId: "G-72TXE25F8B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Track login state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user.email, user.displayName);

    // Optional redirect if user is logged in and on login/signup page
    const path = window.location.pathname;
    if (path.includes("login.html") || path.includes("signup.html")) {
      window.location.href = "/src/dashboard.html";
    }
  } else {
    console.log("No user is signed in.");

    // Optional redirect if user logs out and tries to access dashboard
    const path = window.location.pathname;
    if (path.includes("dashboard.html")) {
      window.location.href = "/index.html";
    }
  }
});

// ✅ LOGIN
const loginBtn = document.getElementById("login-btn");
if (loginBtn) {
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        console.log("User logged in successfully");
        window.location.href = "/src/dashboard.html"; // redirect after login
      })
      .catch((error) => {
        console.error("Error logging in:", error);
        alert(error.message);
      });
  });
}

// ✅ SIGNUP
const signupBtn = document.getElementById("signup-btn");
if (signupBtn) {
  signupBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const name = document.getElementById("fName").value;
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // Use your name + username as the Firebase display name
        return updateProfile(user, {
          displayName: `${name} (${username})`,
        });
      })
      .then(() => {
        console.log("✅ User signed up and profile updated!");
        window.location.href = "/src/dashboard.html";
      })
      .catch((error) => {
        console.error("❌ Error signing up:", error);
        alert(error.message);
      });
  });
}

// ✅ GOOGLE SIGN-IN
const googleBtn = document.getElementById("googleSignIn");
if (googleBtn) {
  googleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log("Google sign-in successful:", result.user.email);
        window.location.href = "/src/dashboard.html";
      })
      .catch((error) => {
        console.error("Error with Google sign-in:", error);
        alert(error.message);
      });
  });
}

// ✅ SIGN OUT
const signOutBtn = document.getElementById("signOut");
if (signOutBtn) {
  signOutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        console.log("User signed out successfully");
        window.location.href = "/index.html";
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  });
}