import { useState, useEffect } from 'react'
import './App.css'
import { Sidebar } from './components/Sidebar'
import { UserStatsCard } from './components/UserStatsCard'
import { UpdateDataPanel } from './components/UpdateDataPanel'
import { fetchUsernamesFromSheet, getGoogleSheetsConfig, clearCache as clearSheetsCache } from './utils/googleSheets'
import { clearCache } from './utils/leetcodeApi'

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const config = getGoogleSheetsConfig()
      
      const userList = await fetchUsernamesFromSheet(
        config.spreadsheetId,
        config.apiKey
      )
      setUsers(userList)
    } catch (err) {
      setError(err.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    clearSheetsCache()
    clearCache()
    loadUsers()
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <div className="main-content">
        {activeView === 'dashboard' && (
          <div className="content-card">
            <h1>📊 LeetCode Stats</h1>
            
            <div style={{ marginBottom: '20px' }}>
              <button onClick={handleRefresh} style={{ padding: '10px 20px' }}>🔄 Refresh Data</button>
            </div>

            {error && <div className="error" style={{ padding: '15px', marginBottom: '20px' }}>{error}</div>}

            {loading ? (
              <div className="loading">Loading...</div>
            ) : users.length === 0 ? (
              <div style={{ color: '#ddd', textAlign: 'center', padding: '20px' }}>
                <p>No users found. Add usernames to the "Usernames" sheet in Google Sheets.</p>
              </div>
            ) : (
              <div className="users-list">
                {users.map(user => (
                  <UserStatsCard 
                    key={`${user.username}-${refreshKey}`}
                    username={user.username}
                    name={user.name}
                    onError={(u, err) => console.error(`Error loading ${u}:`, err)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'update' && (
          <UpdateDataPanel users={users} />
        )}
      </div>
    </div>
  )
}

export default App
