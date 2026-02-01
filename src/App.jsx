import { useState, useEffect } from 'react'
import './App.css'
import { Sidebar } from './components/Sidebar'
import { UserStatsCard } from './components/UserStatsCard'
import { SettingsPanel } from './components/SettingsPanel'
import { UpdateDataPanel } from './components/UpdateDataPanel'
import { fetchUsernamesFromSheet, getPlaceholderUsernames, getGoogleSheetsConfig, saveUsernamesToStorage, clearCache as clearSheetsCache } from './utils/googleSheets'
import { clearCache } from './utils/leetcodeApi'

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [usernames, setUsernames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [customUsername, setCustomUsername] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadUsernames()
  }, [])

  const loadUsernames = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const config = getGoogleSheetsConfig()
      
      if (config?.configured && config?.spreadsheetId && config?.apiKey) {
        try {
          const names = await fetchUsernamesFromSheet(
            config.spreadsheetId,
            config.apiKey
          )
          setUsernames(names)
          saveUsernamesToStorage(names)
        } catch (err) {
          console.warn('Google Sheets fetch failed, using placeholder:', err.message)
          const placeholders = getPlaceholderUsernames()
          setUsernames(placeholders)
        }
      } else {
        const placeholders = getPlaceholderUsernames()
        setUsernames(placeholders)
      }
    } catch (err) {
      setError('Failed to load usernames. Using placeholder data.')
      const placeholders = getPlaceholderUsernames()
      setUsernames(placeholders)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUsername = () => {
    if (customUsername.trim() && !usernames.includes(customUsername.trim())) {
      const updated = [...usernames, customUsername.trim()]
      setUsernames(updated)
      saveUsernamesToStorage(updated)
      setCustomUsername('')
      setRefreshKey(k => k + 1)
    }
  }

  const handleRemoveUsername = (username) => {
    const updated = usernames.filter(u => u !== username)
    setUsernames(updated)
    saveUsernamesToStorage(updated)
  }

  const handleRefresh = () => {
    clearSheetsCache()
    clearCache()
    loadUsernames()
    setRefreshKey(k => k + 1)
  }

  const handleSettingsSaved = () => {
    clearSheetsCache()
    clearCache()
    loadUsernames()
  }

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <div className="main-content">
        {activeView === 'dashboard' && (
          <div className="content-card">
            <h1>📊 LeetCode Stats Dashboard</h1>
            
            <div className="input-section">
              <input
                type="text"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddUsername()}
                placeholder="Enter LeetCode username..."
              />
              <button onClick={handleAddUsername}>Add User</button>
              <button onClick={handleRefresh} style={{ marginLeft: '10px' }}>🔄 Refresh</button>
            </div>

            {error && <div className="error">{error}</div>}

            {loading ? (
              <div className="loading">Loading user data...</div>
            ) : usernames.length === 0 ? (
              <div style={{ color: '#ddd', textAlign: 'center', padding: '20px' }}>
                <p>No usernames found. Add one above or configure Google Sheets in Settings.</p>
              </div>
            ) : (
              <div className="users-list">
                {usernames.map(username => (
                  <div key={`${username}-${refreshKey}`} style={{ position: 'relative' }}>
                    <UserStatsCard 
                      username={username}
                      onError={(user, err) => console.error(`Error loading ${user}:`, err)}
                    />
                    <button
                      onClick={() => handleRemoveUsername(username)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(255, 0, 0, 0.2)',
                        border: 'none',
                        color: '#ff6b6b',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'update' && (
          <UpdateDataPanel usernames={usernames} />
        )}

        {activeView === 'settings' && (
          <SettingsPanel onSheetsConfigured={handleSettingsSaved} />
        )}
      </div>
    </div>
  )
}

export default App
