import React, { useState } from 'react';
import { fetchAndUpdateUserStats } from '../utils/leetcodeApi';
import { updateCachedUserData, getGoogleSheetsConfig, fetchCachedUserData } from '../utils/googleSheets';

export const UpdateDataPanel = ({ usernames = [] }) => {
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ completed: 0, total: 0 });
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(usernames[0] || '');

  const getSortedUsernames = async (config) => {
    try {
      const usersWithTimestamps = await Promise.all(
        usernames.map(async (username) => {
          try {
            const data = await fetchCachedUserData(username, config.spreadsheetId, config.apiKey);
            return {
              username,
              lastUpdated: data?.lastUpdated ? new Date(data.lastUpdated).getTime() : 0
            };
          } catch {
            return { username, lastUpdated: 0 };
          }
        })
      );

      return usersWithTimestamps
        .sort((a, b) => a.lastUpdated - b.lastUpdated)
        .map(u => u.username);
    } catch (error) {
      console.error('Error sorting users:', error);
      return usernames;
    }
  };

  const handleUpdateAll = async () => {
    if (usernames.length === 0) {
      setMessage('❌ No users to update');
      return;
    }

    setUpdating(true);
    setMessage('🔄 Sorting users by oldest update first...');
    setUpdateProgress({ completed: 0, total: usernames.length });

    try {
      const config = getGoogleSheetsConfig();
      
      // Get sorted usernames (oldest first)
      const sortedUsernames = await getSortedUsernames(config);
      const results = { success: 0, failed: 0, rateLimited: 0 };

      for (let i = 0; i < sortedUsernames.length; i++) {
        const username = sortedUsernames[i];
        try {
          setMessage(`📊 ${i + 1}/${sortedUsernames.length}: ${username}`);
          
          // Fetch from LeetCode API
          const userData = await fetchAndUpdateUserStats(username);
          
          // Update Google Sheet
          await updateCachedUserData(userData, config.spreadsheetId, config.apiKey);
          
          results.success++;
          setUpdateProgress({ completed: i + 1, total: sortedUsernames.length });
        } catch (error) {
          const errorMsg = error.message || '';
          
          if (errorMsg.includes('Too many request') || errorMsg.includes('429')) {
            results.rateLimited++;
            setMessage(`⚠️ Rate limit hit after ${results.success} successful updates.\nFetching remaining data from cached sheet...`);
            // Show cached data instead of continuing
            break;
          } else {
            results.failed++;
            console.error(`Failed to update ${username}:`, error);
            setUpdateProgress({ completed: i + 1, total: sortedUsernames.length });
          }
        }
      }

      setMessage(
        `✅ Update cycle complete!\n` +
        `✓ Updated: ${results.success}\n` +
        `✗ Failed: ${results.failed}\n` +
        `⚠️ Rate Limited: ${results.rateLimited}\n\n` +
        `Showing cached data from Google Sheet.`
      );
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateSingle = async () => {
    if (!selectedUser) {
      setMessage('❌ Select a user to update');
      return;
    }

    setUpdating(true);
    setMessage(`🔄 Updating ${selectedUser}...`);

    try {
      const config = getGoogleSheetsConfig();

      // Fetch from LeetCode API
      const userData = await fetchAndUpdateUserStats(selectedUser);
      
      // Update Google Sheet
      await updateCachedUserData(userData, config.spreadsheetId, config.apiKey);
      
      setMessage(
        `✅ Updated ${selectedUser}!\n` +
        `Name: ${userData.name}\n` +
        `Solved: ${userData.solved} problems\n` +
        `Badges: ${userData.badges}`
      );
    } catch (error) {
      const errorMsg = error.message || '';
      
      if (errorMsg.includes('Too many request') || errorMsg.includes('429')) {
        setMessage(`⚠️ Rate limit reached.\nShowing cached data from Google Sheet.`);
      } else {
        setMessage(`❌ Error: ${errorMsg}`);
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="content-card">
      <h1>🚀 Update Cache</h1>
      
      <div style={{ 
        backgroundColor: 'rgba(111, 179, 105, 0.1)', 
        border: '1px solid #6fb369',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px',
        color: '#ddd'
      }}>
        <p>💡 <strong>How it works:</strong></p>
        <p>Fetch fresh LeetCode data and update the cache.</p>
        <p>Updates oldest first (longest time since last update).</p>
        <p>If rate limit hit, cached data is shown instead.</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={handleUpdateAll}
          disabled={updating || usernames.length === 0}
          style={{ 
            flex: 1,
            backgroundColor: updating ? '#3a3838' : '#1a1919',
            opacity: updating ? 0.6 : 1,
            cursor: updating ? 'not-allowed' : 'pointer'
          }}
        >
          {updating ? '⏳ Updating...' : '⚡ Update All (Oldest First)'}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#ddd', display: 'block', marginBottom: '8px' }}>
          Or update a single user:
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            disabled={updating}
            style={{
              flex: 1,
              padding: '10px 15px',
              background: '#262526',
              border: '1px solid rgb(110, 100, 100)',
              borderRadius: '8px',
              color: '#ddd',
              fontFamily: 'inherit'
            }}
          >
            <option value="">Select a user...</option>
            {usernames.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
          <button 
            onClick={handleUpdateSingle}
            disabled={updating || !selectedUser}
            style={{ 
              backgroundColor: updating ? '#3a3838' : '#1a1919',
              opacity: updating ? 0.6 : 1,
              cursor: updating ? 'not-allowed' : 'pointer'
            }}
          >
            {updating ? '⏳' : '✏️'}
          </button>
        </div>
      </div>

      {updateProgress.total > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#262526',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid rgb(110, 100, 100)'
          }}>
            <div style={{
              width: `${(updateProgress.completed / updateProgress.total) * 100}%`,
              height: '100%',
              backgroundColor: '#6fb369',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ color: 'rgb(110, 100, 100)', fontSize: '0.9em', marginTop: '8px' }}>
            {updateProgress.completed}/{updateProgress.total} users processed
          </p>
        </div>
      )}

      {message && (
        <div style={{
          color: message.includes('✅') ? '#6fb369' : message.includes('❌') ? '#ff6b6b' : '#ddd',
          padding: '15px',
          backgroundColor: message.includes('✅') ? 'rgba(111, 179, 105, 0.1)' : 
                           message.includes('❌') ? 'rgba(255, 107, 107, 0.1)' : 
                           'rgba(100, 100, 100, 0.1)',
          borderRadius: '8px',
          border: `1px solid ${message.includes('✅') ? '#6fb369' : 
                            message.includes('❌') ? '#ff6b6b' : 
                            'rgb(110, 100, 100)'}`,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: '0.95em',
          lineHeight: '1.6'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};
