# LeetCode Dashboard - Backend Worker Setup Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Frontend (React/Vite)                                          │
│  ├─ Reads from: CachedData Google Sheet (API KEY READ-ONLY)    │
│  └─ Fast ⚡ No API calls needed                                │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ Displays data
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Backend Workers (Can run on multiple IPs)                      │
│  ├─ Worker 1 (Your PC): Updates users 1-10 every 60 min       │
│  ├─ Worker 2 (Cloud): Updates users 11-20 every 60 min        │
│  ├─ Worker 3 (VPS): Updates users 21-30 every 60 min          │
│  └─ Fetches from: LeetCode API                                 │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ Writes to
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Google Sheets                                                   │
│  ├─ Usernames: List of LeetCode usernames to track             │
│  └─ CachedData: Latest fetched data (username, name, solved,   │
│                 badges, avatar, lastUpdated)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Create the Google Sheets Structure

Create a new sheet with two tabs:

**Sheet 1: "Usernames"**
```
username
giri190507
<add more usernames>
```

**Sheet 2: "CachedData"**
```
username | name | solved | badges | avatar | lastUpdated
---------|------|--------|--------|--------|-------------
giri190507|Giridharan S|105|1|https://...|2026-02-01T...
```

### 2. Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google Sheets API"
4. Create an API key (Credentials > Create Credentials > API Key)
5. Note: The API key in the config already works for read/write

### 3. Run the Backend Worker

#### Option A: Local Machine (Your PC)

```bash
cd /home/giri/Codes/Projects/Gleetrack
node backend-worker.js
```

Output:
```
🤖 LeetCode Backend Worker Started
Configuration:
  Sheet ID: 1BLVo07yZpJbxiX68q8JirUUa6zjfrvljJPIYfIKDO1k
  Update Interval: 60 minutes
  Time: Feb 1, 2026 4:05 PM

📊 Updating 1 users...

Fetching data for giri190507...
✓ Updated giri190507

✅ Update cycle completed at Feb 1, 2026 4:06 PM

⏰ Next update in 60 minutes
```

#### Option B: Run on Schedule (Cron)

Edit crontab:
```bash
crontab -e
```

Add this line to run every 60 minutes:
```
*/60 * * * * cd /home/giri/Codes/Projects/Gleetrack && node backend-worker.js >> worker.log 2>&1
```

Or every 30 minutes:
```
*/30 * * * * cd /home/giri/Codes/Projects/Gleetrack && node backend-worker.js >> worker.log 2>&1
```

#### Option C: Deploy to Cloud (Recommended for avoiding rate limits)

**Using GitHub Actions (Free)**

Create `.github/workflows/leetcode-worker.yml`:

```yaml
name: LeetCode Backend Worker

on:
  schedule:
    - cron: '0 */1 * * *'  # Every hour
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd Gleetrack && node backend-worker.js
```

**Using Render (Free tier)**

1. Connect your repo to Render.com
2. Create a new "Background Job" service
3. Set start command: `cd Gleetrack && node backend-worker.js`
4. Schedule to run every hour

**Using Heroku (Free tier ending)**

```bash
heroku create your-app-name
git push heroku main
heroku ps:scale worker=1
```

### 4. Distribute Across Multiple IPs

To completely avoid rate limits, distribute updates across multiple machines:

**Machine 1 (Home PC)**: Update users 1-10
**Machine 2 (VPS)**: Update users 11-20
**Machine 3 (Cloud)**: Update users 21-30

Modify `backend-worker.js` line ~85:

```javascript
// Update only specific range
const usernames = allUsernames.slice(0, 10); // Only users 0-9
```

### 5. Monitor the Worker

Check logs:
```bash
tail -f worker.log
```

Or create a monitoring dashboard in your app that shows "Last Updated" timestamp.

### 6. Rate Limit Benefits

```
Without Backend Worker:
├─ 100 users on site = 300 API calls immediately
├─ Rate limit: 60 per hour
└─ Result: ❌ Most users get errors

With Backend Worker:
├─ 1 worker updates 60 users every hour = 60 calls/hour ✅
├─ 2 workers on different IPs = 120 calls/hour ✅
├─ 3 workers on different IPs = 180 calls/hour ✅
└─ Result: ✅ No rate limits, smooth experience
```

## Configuration

Edit `backend-worker.js`:

```javascript
const CONFIG = {
  spreadsheetId: '1BLVo07yZpJbxiX68q8JirUUa6zjfrvljJPIYfIKDO1k',
  apiKey: 'AIzaSyDi-wDBNC6fskWYjVaZZws6Yv8ggVfAYFM',
  updateInterval: 60 * 60 * 1000, // Change to 30 * 60 * 1000 for 30 min
  maxRetries: 3
};
```

## Troubleshooting

### "Too many requests" error
- Add another worker on a different IP
- Reduce updateInterval (increase frequency)
- Use VPN/Proxy

### Sheet not updating
- Check API key permissions
- Verify sheet name is "CachedData"
- Check column headers match

### Worker not running
```bash
# Check if Node is installed
node --version

# Run with more verbose logging
DEBUG=* node backend-worker.js
```

## Frontend Usage

The frontend will:
1. Read usernames from "Usernames" sheet
2. Fetch cached data from "CachedData" sheet
3. Display with "Last Updated" timestamp
4. **Never** call LeetCode API directly

Users always get instant data with no API calls! 🚀
