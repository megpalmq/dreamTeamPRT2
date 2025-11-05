import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "/firebase";

const db = getFirestore(app);
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

    snapshot.forEach((doc) => {
      const msg = doc.data();
      const time = msg.timestamp
        ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Just now";

      const div = document.createElement("div");
      div.classList.add("message");
      div.innerHTML = `
        <div class="avatar">${msg.userInitials || "??"}</div>
        <div class="msg-content">
          <h4>${msg.user || "Unknown"} <span class="time">${time}</span></h4>
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

    const user = auth.currentUser?.displayName || "Guest";
    const initials = user
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    await addDoc(collection(db, "messages"), {
      user,
      userInitials: initials,
      text,
      timestamp: serverTimestamp(),
    });

    msgInput.value = "";
  });
}