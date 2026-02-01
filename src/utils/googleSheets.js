const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId: '1BLVo07yZpJbxiX68q8JirUUa6zjfrvljJPIYfIKDO1k',
  apiKey: 'AIzaSyDi-wDBNC6fskWYjVaZZws6Yv8ggVfAYFM',
  usernamesRange: 'Usernames!A:B',
  dataRange: 'CachedData!A:D'
};

const CACHE_DURATION = 5 * 60 * 1000;
let cachedUsernames = null;
let cacheTimestamp = 0;
let cachedData = null;
let cachedDataTimestamp = 0;

export const fetchUsernamesFromSheet = async (spreadsheetId, apiKey, range = 'Usernames!A:B') => {
  try {
    if (cachedUsernames && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      console.log('Using cached usernames');
      return cachedUsernames;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    console.log('Fetching usernames from:', url.replace(apiKey, '***'));
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google Sheets API error:', response.status, errorData);
      throw new Error(`Google Sheets API error: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    const rows = data.values || [];
    
    const usernames = rows
      .slice(1)
      .filter(row => row[0] && row[0].trim() && row[0].trim() !== 'username')
      .map(row => ({
        username: row[0].trim(),
        name: row[1]?.trim() || row[0].trim()
      }));
    
    cachedUsernames = usernames || [];
    cacheTimestamp = Date.now();
    
    return cachedUsernames;
  } catch (error) {
    throw new Error(`Failed to fetch from Google Sheets: ${error.message}`);
  }
};

export const fetchCachedUserData = async (username, spreadsheetId, apiKey) => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/CachedData!A:D?key=${apiKey}`;
    console.log('Fetching cached data from:', url.replace(apiKey, '***'));
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google Sheets API error:', response.status, errorData);
      
      if (response.status === 403) {
        throw new Error('API key does not have permission to access this spreadsheet. Check that the spreadsheet is shared or the API key has proper permissions.');
      }
      if (response.status === 404) {
        throw new Error('Spreadsheet or sheet "CachedData" not found. Make sure you have a sheet named "CachedData" with columns: username, name, solved, lastUpdated');
      }
      
      throw new Error(`Google Sheets API error: ${response.status}`);
    }
    
    const data = await response.json();
    const rows = data.values || [];
    
    console.log(`CachedData sheet rows:`, rows);
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0]?.toLowerCase() === username.toLowerCase()) {
        return {
          username: rows[i][0],
          name: rows[i][1],
          solved: rows[i][2],
          lastUpdated: rows[i][3]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching cached data for ${username}:`, error);
    throw new Error(`Failed to fetch cached data: ${error.message}`);
  }
};

export const updateCachedUserData = async (userData, spreadsheetId, apiKey) => {
  try {
    console.log(`Updating cached data for ${userData.username}...`);
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/CachedData!A:D?key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error('Failed to fetch existing data');
    
    const data = await response.json();
    const rows = data.values || [];
    
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0]?.toLowerCase() === userData.username.toLowerCase()) {
        rowIndex = i;
        break;
      }
    }

    const range = rowIndex >= 0 
      ? `CachedData!A${rowIndex + 1}:D${rowIndex + 1}`
      : `CachedData!A:D`;

    const method = rowIndex >= 0 ? 'PUT' : 'POST';
    const endpoint = rowIndex >= 0 
      ? `/values/${range.replace(/!/g, '%21')}` 
      : `/values:append?valueInputOption=USER_ENTERED`;
    
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${endpoint}&key=${apiKey}`;
    
    const updateResponse = await fetch(updateUrl, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: [[
          userData.username,
          userData.name || userData.username,
          userData.solved || 0,
          new Date().toISOString()
        ]]
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update sheet: ${updateResponse.status}`);
    }

    console.log(`✓ Updated ${userData.username} in cache`);
    return await updateResponse.json();
  } catch (error) {
    throw new Error(`Failed to update cached data: ${error.message}`);
  }
};

export const getGoogleSheetsConfig = () => {
  return {
    configured: true,
    spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
    apiKey: GOOGLE_SHEETS_CONFIG.apiKey,
    usernamesRange: GOOGLE_SHEETS_CONFIG.usernamesRange,
    dataRange: GOOGLE_SHEETS_CONFIG.dataRange
  };
};

export const updateGoogleSheetsConfig = (config) => {
  if (config.spreadsheetId) GOOGLE_SHEETS_CONFIG.spreadsheetId = config.spreadsheetId;
  if (config.apiKey) GOOGLE_SHEETS_CONFIG.apiKey = config.apiKey;
  if (config.usernamesRange) GOOGLE_SHEETS_CONFIG.usernamesRange = config.usernamesRange;
  if (config.dataRange) GOOGLE_SHEETS_CONFIG.dataRange = config.dataRange;
  
  cachedUsernames = null;
  cacheTimestamp = 0;
  cachedData = null;
  cachedDataTimestamp = 0;
};

export const getPlaceholderUsernames = () => {
  const stored = localStorage.getItem('leetcodeUsernames');
  if (stored) {
    return JSON.parse(stored);
  }
  
  return ['giri190507'];
};

export const saveUsernamesToStorage = (usernames) => {
  localStorage.setItem('leetcodeUsernames', JSON.stringify(usernames));
};

export const clearCache = () => {
  cachedUsernames = null;
  cacheTimestamp = 0;
  cachedData = null;
  cachedDataTimestamp = 0;
};
