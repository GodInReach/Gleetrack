import React from 'react';

export const Sidebar = ({ activeView, setActiveView }) => {
  const views = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'update', icon: '🚀', label: 'Update Cache' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-item">🎯</div>
      </div>
      
      <div className="sidebar-section">
        {views.map(view => (
          <button
            key={view.id}
            className={`sidebar-item ${activeView === view.id ? 'active' : ''}`}
            onClick={() => setActiveView(view.id)}
            title={view.label}
          >
            {view.icon}
          </button>
        ))}
      </div>
      
      <div className="sidebar-section" style={{ marginTop: 'auto' }}>
        <button className="sidebar-item" title="Logout">
          ⏻
        </button>
      </div>
    </div>
  );
};
