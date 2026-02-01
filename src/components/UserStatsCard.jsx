import React, { useState, useEffect } from 'react';
import { fetchCachedUserData, getGoogleSheetsConfig } from '../utils/googleSheets';

export const UserStatsCard = ({ username, onError }) => {
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
          setError(`No cached data found for ${username}. Please wait for the backend to update.`);
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

  // Extract data from cached response
  const realName = userData?.name || username;
  const solvedCount = userData?.solved || 'N/A';
  const badgeCount = userData?.badges || 0;
  const avatar = userData?.avatar || '';
  const lastUpdated = userData?.lastUpdated 
    ? new Date(userData.lastUpdated).toLocaleString() 
    : 'Never';

  return (
    <div className="user-item">
      <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
        {avatar && (
          <img 
            src={avatar} 
            alt={realName}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '2px solid rgb(110, 100, 100)'
            }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div className="user-name">{realName || username}</div>
          <div className="user-stats">
            <div className="stat">
              <span className="stat-label">Username</span>
              <span className="stat-value">@{username}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Problems Solved</span>
              <span className="stat-value">{solvedCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Badges</span>
              <span className="stat-value">🏆 {badgeCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Last Updated</span>
              <span className="stat-value" style={{ fontSize: '0.85em', color: 'rgb(150, 150, 150)' }}>
                {lastUpdated}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
