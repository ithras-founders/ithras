/**
 * TelemetryLayout - Wrapper for telemetry pages with filters and time range.
 */
import React, { useState } from 'react';
import htm from 'htm';
import TelemetryFilterBar from './components/TelemetryFilterBar.js';
import TelemetryDateRangePicker from './components/TelemetryDateRangePicker.js';

const html = htm.bind(React.createElement);

/**
 * @param {{
 *   activeSection: string,
 *   title: string,
 *   children: React.ReactNode,
 *   showFilters?: boolean,
 *   showDateRange?: boolean,
 *   filterProps?: object,
 * }} props
 */
const TelemetryLayout = ({
  activeSection,
  title,
  children,
  showFilters = true,
  showDateRange = true,
  filterProps = {},
}) => {
  const [filters, setFilters] = useState({});
  const [timeRange, setTimeRange] = useState({ preset: '24h' });

  return html`
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${title}</h1>
        <div className="flex flex-wrap items-center gap-4">
          ${showDateRange ? html`<${TelemetryDateRangePicker} range=${timeRange} onChange=${setTimeRange} />` : null}
        </div>
      </div>
      ${showFilters ? html`
        <${TelemetryFilterBar}
          filters=${filters}
          onChange=${setFilters}
          filterConfig=${filterProps}
        />
      ` : null}
      ${children}
    </div>
  `;
};

export default TelemetryLayout;
