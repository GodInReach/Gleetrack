const LEETCODE_API_BASE = 'https://alfa-leetcode-api.onrender.com';

const CACHE_DURATION = 30 * 60 * 1000;
const apiCache = new Map();

const getFromCache = (key) => {
  const cached = apiCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`Cache hit for ${key}`);
    return cached.data;
  }
  if (cached) apiCache.delete(key);
  return null;
};

const setCache = (key, data) => {
  apiCache.set(key, { data, timestamp: Date.now() });
};

const isRateLimitError = (statusText) => {
  return statusText?.includes('Too many request') || statusText?.includes('429');
};

export const fetchUserProfile = async (username) => {
  const cacheKey = `profile:${username}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${LEETCODE_API_BASE}/${username}`);
    if (!response.ok) {
      const text = await response.text();
      if (isRateLimitError(text)) {
        throw new Error('Fetching... may take an hour due to exceeding API rate limits.');
      }
      throw new Error('User not found');
    }
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch profile for ${username}: ${error.message}`);
  }
};

export const fetchFullProfile = async (username) => {
  const cacheKey = `fullProfile:${username}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${LEETCODE_API_BASE}/${username}/profile`);
    if (!response.ok) throw new Error('User not found');
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch full profile for ${username}: ${error.message}`);
  }
};

export const fetchSolvedCount = async (username) => {
  const cacheKey = `solved:${username}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${LEETCODE_API_BASE}/${username}/solved`);
    if (!response.ok) throw new Error('Failed to fetch solved count');
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch solved count for ${username}: ${error.message}`);
  }
};

export const fetchContestDetails = async (username) => {
  const cacheKey = `contest:${username}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${LEETCODE_API_BASE}/${username}/contest`);
    if (!response.ok) throw new Error('Failed to fetch contest details');
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch contest for ${username}: ${error.message}`);
  }
};

export const fetchSkillStats = async (username) => {
  const cacheKey = `skill:${username}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${LEETCODE_API_BASE}/${username}/skill`);
    if (!response.ok) throw new Error('Failed to fetch skill stats');
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch skill stats for ${username}: ${error.message}`);
  }
};

export const fetchLanguageStats = async (username) => {
  const cacheKey = `language:${username}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${LEETCODE_API_BASE}/${username}/language`);
    if (!response.ok) throw new Error('Failed to fetch language stats');
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch language stats for ${username}: ${error.message}`);
  }
};

export const fetchBadges = async (username) => {
  const cacheKey = `badges:${username}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${LEETCODE_API_BASE}/${username}/badges`);
    if (!response.ok) throw new Error('Failed to fetch badges');
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch badges for ${username}: ${error.message}`);
  }
};

export const fetchUserStats = async (username) => {
  try {
    const [profile, contest] = await Promise.all([
      fetchUserProfile(username),
      fetchContestDetails(username).catch(() => ({}))
    ]);

    return {
      username,
      ...profile,
      contest: contest?.contestDetails || {}
    };
  } catch (error) {
    throw new Error(`Failed to fetch stats for ${username}: ${error.message}`);
  }
};

export const fetchAndUpdateUserStats = async (username) => {
  try {
    console.log(`Fetching fresh data for ${username}...`);
    
    const [profileRes, solvedRes, badgesRes] = await Promise.all([
      fetch(`${LEETCODE_API_BASE}/${username}`),
      fetch(`${LEETCODE_API_BASE}/${username}/solved`),
      fetch(`${LEETCODE_API_BASE}/${username}/badges`)
    ]);

    if (!profileRes.ok || !solvedRes.ok || !badgesRes.ok) {
      throw new Error(`API error: profile=${profileRes.status}, solved=${solvedRes.status}, badges=${badgesRes.status}`);
    }

    const profile = await profileRes.json();
    const solved = await solvedRes.json();
    const badges = await badgesRes.json();

    const userData = {
      username,
      name: profile.name || '',
      solved: solved.solvedProblem || 0,
      badges: badges.badgesCount || 0,
      avatar: profile.avatar || ''
    };

    console.log(`✓ Fetched fresh data for ${username}`, userData);
    return userData;
  } catch (error) {
    throw new Error(`Failed to fetch stats for ${username}: ${error.message}`);
  }
};

export const clearCache = () => {
  apiCache.clear();
  console.log('API cache cleared');
};

export const getCacheStats = () => {
  return {
    cacheSize: apiCache.size,
    cachedKeys: Array.from(apiCache.keys()),
    cacheDuration: `${CACHE_DURATION / 60000} minutes`
  };
};
