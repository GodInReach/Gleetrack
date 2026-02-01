import React, { useState } from 'react';
import { updateGoogleSheetsConfig, getGoogleSheetsConfig } from '../utils/googleSheets';

export const SettingsPanel = ({ onSheetsConfigured }) => {
  const config = getGoogleSheetsConfig();
  const [spreadsheetId, setSpreadsheetId] = useState(config?.spreadsheetId || '');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [saveMessage, setSaveMessage] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  const handleSave = () => {
    if (spreadsheetId.trim() && apiKey.trim()) {
      updateGoogleSheetsConfig({ spreadsheetId, apiKey });
      setSaveMessage('✓ Settings saved successfully!');
      onSheetsConfigured?.();
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage('Please fill in all fields');
    }
  };

  const handleTestApi = async () => {
    if (!spreadsheetId.trim() || !apiKey.trim()) {
      setSaveMessage('❌ Please fill in all fields first');
      return;
    }

    setTestLoading(true);
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setSaveMessage(`✓ API key works! Spreadsheet: "${data.properties.title}"`);
      } else if (response.status === 403) {
        setSaveMessage('❌ 403 Error: API key does not have permission. Make sure you enabled Google Sheets API and the spreadsheet is accessible.');
      } else if (response.status === 404) {
        setSaveMessage('❌ 404 Error: Spreadsheet not found. Check your Spreadsheet ID.');
      } else {
        setSaveMessage(`❌ Error: ${response.status}`);
      }
    } catch (error) {
      setSaveMessage(`❌ Error: ${error.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="content-card">
      <h1>⚙️ Settings</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ color: '#ddd', display: 'block', marginBottom: '8px' }}>
            Google Sheets Spreadsheet ID
          </label>
          <input
            type="text"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            placeholder="e.g., 1BxiMVs0XRA5nFMbWxPcVDm4LzX-qf3Q4rrx..."
            style={{
              width: '100%',
              padding: '10px 15px',
              background: '#262526',
              border: '1px solid rgb(110, 100, 100)',
              borderRadius: '8px',
              color: '#ddd',
              fontFamily: 'inherit'
            }}
          />
          <p style={{ color: 'rgb(110, 100, 100)', fontSize: '0.85em', marginTop: '5px' }}>
            Find this in the URL: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/...
          </p>
        </div>

        <div>
          <label style={{ color: '#ddd', display: 'block', marginBottom: '8px' }}>
            Google Sheets API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Get from Google Cloud Console..."
            style={{
              width: '100%',
              padding: '10px 15px',
              background: '#262526',
              border: '1px solid rgb(110, 100, 100)',
              borderRadius: '8px',
              color: '#ddd',
              fontFamily: 'inherit'
            }}
          />
          <p style={{ color: 'rgb(110, 100, 100)', fontSize: '0.85em', marginTop: '5px' }}>
            Create one at: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console</a>
          </p>
        </div>

        <div>
          <label style={{ color: '#ddd', display: 'block', marginBottom: '8px' }}>
            Expected Sheet Format
          </label>
          <p style={{ color: 'rgb(110, 100, 100)', fontSize: '0.9em', marginTop: '5px' }}>
            Column A should contain LeetCode usernames (one per row, header optional)
          </p>
        </div>

        <button onClick={handleSave} style={{ padding: '12px', marginTop: '10px' }}>
          Save Settings
        </button>

        <button 
          onClick={handleTestApi} 
          disabled={testLoading}
          style={{ 
            padding: '12px', 
            marginTop: '5px',
            background: '#4a7c59',
            cursor: testLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {testLoading ? '🔄 Testing...' : '🧪 Test API Key'}
        </button>

        {saveMessage && (
          <div style={{
            color: saveMessage.includes('✓') ? '#6fb369' : '#ff6b6b',
            padding: '12px',
            backgroundColor: saveMessage.includes('✓') ? 'rgba(111, 179, 105, 0.1)' : 'rgba(255, 107, 107, 0.1)',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '0.9em',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
};
