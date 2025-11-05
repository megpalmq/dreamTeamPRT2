// src/js/dashboard.js
const dropZone = document.getElementById("drop-zone");
const playersContainer = document.querySelector(".players");
const pointsBar = document.getElementById("points-bar");
const assistsBar = document.getElementById("assists-bar");
const pointsVal = document.getElementById("points-val");
const assistsVal = document.getElementById("assists-val");
const refreshBtn = document.getElementById("refresh-btn");

// Store player data and user lineup
let playersData = [];
let lineup = [];

// Fetch Pacers players from balldontlie
async function fetchPacersPlayers() {
  const url =
    "https://api.allorigins.win/get?url=" +
    encodeURIComponent("https://www.balldontlie.io/api/v1/players?team_ids[]=12&per_page=50");
  const res = await fetch(url);
  const wrapper = await res.json();             // { contents: "actual JSON string" }
  const data = JSON.parse(wrapper.contents);    // parse real JSON
  playersData = data.data;
  displayPlayers();
}


// Fetch a player's current season averages
async function fetchPlayerStats(playerId) {
  const res = await fetch(`/balldontlie/api/v1/season_averages?player_ids[]=${playerId}`);
  if (!res.ok) {
    const text = await res.text();
    console.error("API error:", res.status, text);
    throw new Error("Failed to fetch stats");
  }
  const data = await res.json();
  return data.data[0] || null;
}


// Display players as draggable buttons
function displayPlayers() {
  playersContainer.innerHTML = "";
  playersData.forEach(player => {
    const div = document.createElement("div");
    div.classList.add("player");
    div.textContent = `${player.first_name} ${player.last_name}`;
    div.draggable = true;
    div.dataset.id = player.id;

    div.addEventListener("dragstart", e => {
      e.dataTransfer.setData("player-id", player.id);
    });

    playersContainer.appendChild(div);
  });
}

// Allow dropping players into the lineup zone
dropZone.addEventListener("dragover", e => e.preventDefault());
dropZone.addEventListener("drop", async e => {
  e.preventDefault();
  const playerId = e.dataTransfer.getData("player-id");
  const player = playersData.find(p => p.id == playerId);

  if (!player || lineup.some(p => p.id === player.id) || lineup.length >= 5) return;

  // Fetch real stats
  const stats = await fetchPlayerStats(player.id);
  if (!stats) {
    alert(`${player.first_name} ${player.last_name} has no current season stats.`);
    return;
  }

  player.stats = stats;
  lineup.push(player);

  const div = document.createElement("div");
  div.textContent = `${player.first_name} ${player.last_name}`;
  div.classList.add("lineup-player");
  dropZone.appendChild(div);

  updateStats();
});

// Update total stats based on lineup
function updateStats() {
  const totalPoints = lineup.reduce((sum, p) => sum + (p.stats?.pts || 0), 0);
  const totalAssists = lineup.reduce((sum, p) => sum + (p.stats?.ast || 0), 0);

  const pointsPct = Math.min((totalPoints / 150) * 100, 100);
  const assistsPct = Math.min((totalAssists / 50) * 100, 100);

  pointsBar.style.width = `${pointsPct}%`;
  assistsBar.style.width = `${assistsPct}%`;

  pointsVal.textContent = Math.round(totalPoints);
  assistsVal.textContent = Math.round(totalAssists);
}

// Reset lineup
refreshBtn.addEventListener("click", () => {
  lineup = [];
  dropZone.innerHTML = `<p><strong>BUILD YOUR DREAMTEAM</strong><br>Drag & Drop players into this area</p>`;
  updateStats();
});
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Invalid JSON. Received:", text.slice(0, 100));
    throw new Error("Invalid JSON response");
  }
}
// Initialize
fetchPacersPlayers();
