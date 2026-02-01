import React, { useState, useEffect } from 'react';
import { fetchCachedUserData, getGoogleSheetsConfig } from '../utils/googleSheets';

export const UserStatsCard = ({ username, name, onError }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching cached stats for ${username}...`);
        
        const config = getGoogleSheetsConfig();
        const data = await fetchCachedUserData(username, config.spreadsheetId, config.apiKey);
        
        if (!data) {
          setError(`No cached data yet for @${username}. Click "Update Cache" to fetch data.`);
          onError?.(username, 'No cached data');
          return;
        }
        
        console.log(`Successfully fetched cached data for ${username}:`, data);
        setUserData(data);
      } catch (err) {
        const errorMsg = err.message;
        console.error(`Error loading ${username}:`, errorMsg);
        setError(errorMsg);
        onError?.(username, errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [username, onError]);

  if (loading) {
    return (
      <div className="user-item">
        <div className="user-name">{username}</div>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-item" style={{ borderColor: 'rgba(255, 0, 0, 0.3)' }}>
        <div className="user-name">{username}</div>
        <div className="error">{error}</div>
      </div>
    );
  }

  const solvedCount = userData?.solved || 'N/A';
  const displayName = userData?.name || name || username;
  const lastUpdated = userData?.lastUpdated 
    ? new Date(userData.lastUpdated).toLocaleString() 
    : 'Never';

  return (
    <div className="user-item">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <div className="user-name">{displayName}</div>
          <div style={{ color: 'rgb(150, 150, 150)', fontSize: '0.85em', marginTop: '4px' }}>
            @{username} • Updated: {lastUpdated}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#6fb369' }}>{solvedCount}</div>
          <div style={{ color: 'rgb(150, 150, 150)', fontSize: '0.85em' }}>problems solved</div>
        </div>
      </div>
    </div>
  );
};
