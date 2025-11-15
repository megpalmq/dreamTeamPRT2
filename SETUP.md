# Dream Team - Setup Instructions

## 🚀 Getting Started

### Step 1: Get a Ball Don't Lie API Key
1. Go to https://balldontlie.io/api
2. Sign up for a free account
3. Copy your API key

### Step 2: Update API Key
1. Open `api.js`
2. Find this line: `const API_KEY = "1a346ac3-c9ce-49ba-abb7-82c24e288cdd";`
3. Replace it with your actual API key

### Step 3: Install Dependencies (if needed)
The API server uses only Node.js built-in modules, so no npm install needed for the backend!

### Step 4: Run Both Servers
You need to run **TWO terminals**:

**Terminal 1 - API Server:**
```bash
npm run api
```
This starts the backend server on `http://localhost:3001`

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```
This starts Vite on `http://localhost:5173` (or similar)

### Alternative: Run Both at Once
If you have `concurrently` installed:
```bash
npm install -D concurrently
npm run dev:full
```

## 🏗️ Architecture

- **`api.js`** - Backend proxy that fetches real data from Ball Don't Lie API and handles CORS
- **`src/js/dashboard.js`** - Frontend that calls the backend API to get player stats
- **`localhost:3001`** - Backend API server
- **`localhost:5173`** - Frontend dev server

## 🔌 API Endpoints

Your backend provides these endpoints:

- `GET http://localhost:3001/api/players?team_id=12` - Get all Pacers players
- `GET http://localhost:3001/api/stats?season=2024&player_ids=1,2,3` - Get player stats

## ✅ How It Works

1. Frontend loads → calls `http://localhost:3001/api/players?team_id=12`
2. Backend receives request → fetches from Ball Don't Lie API with your API key
3. Backend returns real player data → Frontend displays players
4. When you drag players → Frontend calls stats endpoint for their stats
5. Progress bars update based on real NBA statistics

## 🐛 Troubleshooting

**"Error loading players":**
- Make sure API server is running (`npm run api`)
- Check that Ball Don't Lie API key is correct in `api.js`
- Check browser console for detailed errors

**CORS errors:**
- Your backend already handles CORS, but make sure localhost:3001 is accessible

**401 Unauthorized:**
- Your Ball Don't Lie API key is invalid
- Go to https://balldontlie.io/api and generate a new one

## 📝 Notes

- Data is cached in localStorage after first load
- Stats are for the 2024 season (change in `dashboard.js` if needed)
- Only players with actual stats are displayed
