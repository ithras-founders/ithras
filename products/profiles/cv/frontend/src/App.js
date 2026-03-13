import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { Layout } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('cv');

  useEffect(() => {
    const savedUser = localStorage.getItem('ithras_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ithras_session');
  };

  if (!user) {
    return html`<div className="p-20 text-center">Please log in through core frontend</div>`;
  }

  return html`
    <${Layout} user=${user} onLogout=${handleLogout} activeView=${view} setView=${setView}>
      <div className="p-20 text-center">
        <p className="text-[var(--app-text-secondary)]">CV module — use the core frontend for full functionality.</p>
      </div>
    <//>
  `;
};

export default App;
