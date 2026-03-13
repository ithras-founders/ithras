import React from 'react';
import htm from 'htm';
import AuditTrailPanel from '/core/frontend/src/modules/shared/components/AuditTrailPanel.js';
import { Card } from './shared.js';

const html = htm.bind(React.createElement);

const AuditTab = () => html`
  <div className="space-y-8">
    <${Card} title="Activity Timeline" className="overflow-visible">
      <${AuditTrailPanel} showFilters=${true} limit=${50} apiSource="telemetry" />
    <//>
  </div>
`;

export { AuditTab };
