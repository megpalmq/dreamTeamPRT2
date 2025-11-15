// Simple Node.js API server to proxy Ball Don't Lie API
// Run this with: node api.js

import http from "http";
import https from "https";
import url from "url";

const PORT = 3001;

// Your Ball Don't Lie API credentials (get free at https://balldontlie.io/api)
const API_KEY = "829461bf-d03d-43cd-840f-8d44e3f2a8bb"; // Replace with your actual key
const BASE_API = "https://api.balldontlie.io/v1";

// Helper to make HTTPS requests with retry logic
function makeRequest(apiUrl, options = {}, retries = 3) {
  return new Promise((resolve, reject) => {
    const attemptRequest = (retriesLeft) => {
      const req = https.get(apiUrl, {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "User-Agent": "DreamTeam/1.0",
          ...options.headers,
        },
      }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          // If the external API responds with 429, attempt retry with backoff
          if (res.statusCode === 429 && retriesLeft > 0) {
            const backoff = 500 * Math.pow(2, (3 - retriesLeft)); // 500ms, 1000ms, 2000ms
            console.log(`⚠️ Received 429, backing off ${backoff}ms and retrying (${retriesLeft - 1} tries left)`);
            setTimeout(() => attemptRequest(retriesLeft - 1), backoff);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      });
      
      req.on("error", (err) => {
        if (retriesLeft > 0) {
          console.log(`⏳ Retrying... (${retriesLeft} attempts left)`);
          setTimeout(() => attemptRequest(retriesLeft - 1), 1000);
        } else {
          reject(err);
        }
      });
    };
    
    attemptRequest(retries);
  });
}

// Simple in-memory cache to reduce requests to the external API
const cache = new Map();

function setCache(key, data, ttl = 1000 * 60 * 5) { // default 5 minutes
  const expires = Date.now() + ttl;
  cache.set(key, { data, expires });
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

// Create server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  try {
    // Route: GET /api/players?team_id=12
    if (pathname === "/api/players") {
      const teamId = query.team_id || 12;
      const cacheKey = `players:${teamId}`;
      const cached = getCache(cacheKey);
      if (cached) {
        // return cached copy
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(cached));
        return;
      }

      const apiUrl = `${BASE_API}/players?team_ids[]=${teamId}&per_page=100`;
      const result = await makeRequest(apiUrl);
      // If successful, cache the response body for a short time
      if (result && result.status === 200) {
        try {
          setCache(cacheKey, result.data, 1000 * 60 * 5); // cache 5 minutes
        } catch (e) {
          // ignore cache set errors
        }
      }

      res.writeHead(result.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result.data));
    }

    // Route: GET /api/stats?season=2024
    else if (pathname === "/api/stats") {
      const season = query.season || 2024;
      const playerIds = query.player_ids ? query.player_ids.split(",") : [];

      if (!playerIds.length) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No player_ids provided" }));
        return;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

      // Build query string for multiple player IDs
      const playerIdParams = playerIds.map((id) => `player_ids[]=${id}`).join("&");
      const apiUrl = `${BASE_API}/season_averages?season=${season}&${playerIdParams}`;
      console.log(`📡 Fetching stats from: ${apiUrl.substring(0, 100)}...`);
      const result = await makeRequest(apiUrl);
      console.log(`📦 Response status: ${result.status}`);
      if (result.status !== 200) {
        console.log(`⚠️ Response data:`, result.data);
      }
      res.writeHead(result.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result.data));
    }

    // Default route
    else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Route not found" }));
    }
  } catch (err) {
    console.error("❌ Error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`✅ API server running on http://localhost:${PORT}`);
  console.log(`📍 Endpoints:`);
  console.log(`   GET http://localhost:${PORT}/api/players?team_id=12`);
  console.log(`   GET http://localhost:${PORT}/api/stats?season=2024&player_ids=1,2,3`);
});
