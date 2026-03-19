/**
 * Search & Discovery - Search trends and popular queries.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TelemetryLayout from '../TelemetryLayout.js';
import TelemetryTable from '../components/TelemetryTable.js';
import TelemetryEmptyState from '../components/TelemetryEmptyState.js';
import TelemetryChartPlaceholder from '../components/TelemetryChartPlaceholder.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import { getSearchTelemetry } from '../services/telemetryApi.js';

const html = htm.bind(React.createElement);

const SearchTelemetryPage = () => {
  const [data, setData] = useState({ items: [], total: 0 });

  useEffect(() => {
    getSearchTelemetry({}).then(setData);
  }, []);

  return html`
    <${TelemetryLayout} activeSection="search" title="Search & Discovery">
      <div className="space-y-6">
        <${SectionCard} title="Search trends">
          <${TelemetryChartPlaceholder} label="Volume over time" height=${160} />
        </${SectionCard}>

        <${SectionCard} title="Popular queries">
          <${TelemetryTable}
            columns=${[{ key: 'query', label: 'Query' }, { key: 'resultCount', label: 'Results' }]}
            items=${data.items}
            emptyStateSection="search"
          />
        </${SectionCard}>

        <${SectionCard} title="Zero-result trends">
          <${TelemetryEmptyState} section="search" filtersHint="Zero-result queries will appear here." />
        </${SectionCard}>
      </div>
    </${TelemetryLayout}>
  `;
};

export default SearchTelemetryPage;
