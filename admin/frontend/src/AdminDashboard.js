import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * Admin dashboard - stub.
 */
export const AdminDashboard = () => html`
  <div className="p-8">
    <h1 className="text-2xl font-semibold text-[var(--app-text-primary)]">Admin Dashboard</h1>
    <p className="mt-4 text-[var(--app-text-muted)]">Admin module stub. Configure routes and components as needed.</p>
  </div>
`;

export default AdminDashboard;
