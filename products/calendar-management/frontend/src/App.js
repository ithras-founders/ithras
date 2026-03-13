import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { Layout } from '/core/frontend/src/modules/shared/index.js';
import { CompanyCalendarView, StudentCalendarView } from './modules/scheduling/index.js';

const html = htm.bind(React.createElement);

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('calendar');

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
      ${user.role === UserRole.CANDIDATE ? html`
        <${StudentCalendarView} user=${user} />
      ` : user.role === UserRole.RECRUITER ? html`
        <${CompanyCalendarView} user=${user} />
      ` : html`
        <div className="p-20 text-center">Calendar scheduling is available for candidates and recruiters only.</div>
      `}
    <//>
  `;
};

export default App;
