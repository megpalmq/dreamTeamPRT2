import { getFirestore, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
const db = getFirestore();

async function loadLeaderboard() {
  const q = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
  const snapshot = await getDocs(q);

  const list = document.querySelector(".leaderboard-list ul");
  list.innerHTML = "";

  snapshot.docs.forEach((doc, i) => {
    const data = doc.data();
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="rank">${i + 1}</span>
      <div class="user-info">
        <div class="avatar">${data.displayName?.substring(0, 2).toUpperCase()}</div>
        <div>
          <h3>${data.displayName}</h3>
          <p>${data.challengesCompleted || 0} challenges completed</p>
        </div>
      </div>
      <span class="points">${data.points || 0} pts</span>
    `;
    list.appendChild(li);
  });
}