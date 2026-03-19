/**
 * TelemetryEmptyState - Wrapper around EmptyState with telemetry-specific copy.
 */
import React from 'react';
import htm from 'htm';
import EmptyState from '../../community/components/EmptyState.js';

const html = htm.bind(React.createElement);

const MESSAGES = {
  overview: { heading: 'No overview data', description: 'Overview metrics will appear once telemetry is collected.' },
  api: { heading: 'No API requests', description: 'API telemetry will appear when requests are made.' },
  activity: { heading: 'No activity', description: 'Activity events will appear when users interact with the system.' },
  'user-activity': { heading: 'No user activity', description: 'User activity events will appear when users interact with the system.' },
  audit: { heading: 'No audit logs', description: 'Audit logs will appear when admin actions occur.' },
  security: { heading: 'No security events', description: 'Security events will appear when auth or security events occur.' },
  social: { heading: 'No social telemetry', description: 'Community, feed, and messaging events will appear here.' },
  network: { heading: 'No network telemetry', description: 'Network events will appear when connections change.' },
  entity: { heading: 'No entity changes', description: 'Entity change history will appear when entities are modified.' },
  'entity-history': { heading: 'No entity changes', description: 'Entity change history will appear when entities are modified.' },
  jobs: { heading: 'No jobs or webhooks', description: 'Job runs and webhook deliveries will appear here.' },
  errors: { heading: 'No errors', description: 'Errors and failures will appear here when they occur.' },
  search: { heading: 'No search data', description: 'Search telemetry will appear when users search.' },
  moderation: { heading: 'No moderation events', description: 'Moderation actions will appear here.' },
  compliance: { heading: 'No compliance exports', description: 'Data export and compliance events will appear here.' },
  data: { heading: 'No data', description: 'No records match your filters for this time range.' },
};

/**
 * @param {{
 *   section?: string,
 *   filtersHint?: string,
 * }} props
 */
const TelemetryEmptyState = ({ section = 'data', filtersHint }) => {
  const msg = MESSAGES[section] || MESSAGES.data;
  const desc = filtersHint ? `${msg.description} ${filtersHint}` : msg.description;

  return html`
    <${EmptyState}
      heading=${msg.heading}
      description=${desc}
    />
  `;
};

export default TelemetryEmptyState;
