import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app, db } from "../../firebase.js";

const auth = getAuth(app);

// Elements
const msgForm = document.getElementById("message-form");
const msgInput = document.getElementById("message-input");
const messagesDiv = document.getElementById("messages");

// Load messages in real-time
if (messagesDiv) {
  const chatQuery = query(collection(db, "messages"), orderBy("timestamp", "asc"));

  onSnapshot(chatQuery, (snapshot) => {
    messagesDiv.innerHTML = "";

    snapshot.forEach(async (docSnap) => {
      const msg = docSnap.data();
      const time = msg.timestamp
        ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Just now";

      const div = document.createElement("div");
      div.classList.add("message");

      // avatar: prefer photoURL in message, else initials
      let avatarHtml = "";
      if (msg.photoURL) {
        avatarHtml = `<div class="avatar"><img src="${msg.photoURL}" alt="avatar"/></div>`;
      } else {
        const initials = msg.displayName
          ? msg.displayName.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()
          : (msg.userInitials || "??");
        avatarHtml = `<div class="avatar">${initials}</div>`;
      }

      // name line: displayName and optional @username
      const nameLine = `${msg.displayName || msg.user || "Unknown"}${msg.username ? ` <span class=\"username\">@${msg.username}</span>` : ""}`;

      div.innerHTML = `
        ${avatarHtml}
        <div class="msg-content">
          <h4>${nameLine} <span class="time">${time}</span></h4>
          <p>${msg.text}</p>
        </div>
      `;

      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
  });
}

// Send message
if (msgForm) {
  msgForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text) return;

    const currentUser = auth.currentUser;
    let payload = {
      text,
      timestamp: serverTimestamp(),
    };

    if (currentUser) {
      payload.uid = currentUser.uid;
      payload.displayName = currentUser.displayName || null;
      payload.photoURL = currentUser.photoURL || null;

      // try to load username from Firestore users/{uid}
      try {
        const uDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (uDoc.exists()) {
          const data = uDoc.data();
          if (data.username) payload.username = data.username;
        }
      } catch (err) {
        console.warn("Could not load username for message:", err);
      }
    } else {
      payload.displayName = "Guest";
    }

    await addDoc(collection(db, "messages"), payload);

    msgInput.value = "";
  });
}