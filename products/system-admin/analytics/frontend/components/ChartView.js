import React, { useState } from 'react';
import htm from 'htm';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  ScatterChart, Scatter,
} from 'recharts';

const html = htm.bind(React.createElement);

const CHART_TYPES = [
  { id: 'bar', label: 'Bar' },
  { id: 'line', label: 'Line' },
  { id: 'pie', label: 'Pie' },
  { id: 'area', label: 'Area' },
  { id: 'scatter', label: 'Scatter' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ChartView = ({ columns = [], rows = [], chartConfig = {}, onConfigChange, onDrillDown, drillFilters = [] }) => {
  const [chartType, setChartType] = useState(chartConfig.type || 'bar');
  const [xAxis, setXAxis] = useState(chartConfig.xAxis || (columns[0] || ''));
  const [yAxis, setYAxis] = useState(chartConfig.yAxis || (columns[1] || ''));
  const [groupBy, setGroupBy] = useState(chartConfig.groupBy || '');

  const numericColumns = columns.filter(c => {
    if (!rows.length) return true;
    const sample = rows[0][columns.indexOf(c)];
    return typeof sample === 'number' || (typeof sample === 'string' && !isNaN(parseFloat(sample)));
  });
  const allColumns = columns;

  React.useEffect(() => {
    if (onConfigChange) {
      onConfigChange({ type: chartType, xAxis, yAxis, groupBy });
    }
  }, [chartType, xAxis, yAxis, groupBy]);

  const data = React.useMemo(() => {
    if (!rows.length || !xAxis) return [];
    const xIdx = columns.indexOf(xAxis);
    const yIdx = columns.indexOf(yAxis);
    const gIdx = groupBy ? columns.indexOf(groupBy) : -1;

    if (gIdx >= 0 && groupBy) {
      const grouped = {};
      rows.forEach(row => {
        const key = String(row[gIdx] ?? '');
        if (!grouped[key]) grouped[key] = {};
        const xVal = row[xIdx];
        const k = String(xVal ?? '');
        if (!grouped[key][k]) grouped[key][k] = 0;
        grouped[key][k] += typeof row[yIdx] === 'number' ? row[yIdx] : parseFloat(row[yIdx]) || 0;
      });
      const xVals = [...new Set(rows.map(r => String(r[xIdx] ?? '')))];
      return xVals.map(x => {
        const point = { name: x };
        Object.entries(grouped).forEach(([g, vals]) => {
          point[g] = vals[x] ?? 0;
        });
        return point;
      });
    }

    const summed = {};
    rows.forEach(row => {
      const k = String(row[xIdx] ?? '');
      if (!summed[k]) summed[k] = 0;
      summed[k] += typeof row[yIdx] === 'number' ? row[yIdx] : parseFloat(row[yIdx]) || 0;
    });
    return Object.entries(summed).map(([name, value]) => ({ name, value }));
  }, [rows, columns, xAxis, yAxis, groupBy]);

  const pieData = React.useMemo(() => {
    if (chartType !== 'pie' || !data.length) return [];
    return data.map((d, i) => ({ name: d.name, value: d.value, fill: COLORS[i % COLORS.length] }));
  }, [data, chartType]);

  const handleBarClick = (entry) => {
    if (!onDrillDown || !entry) return;
    const name = entry.name ?? entry[xAxis];
    const col = groupBy || xAxis;
    if (col && name != null) onDrillDown({ column: col, value: name });
  };

  const handlePieClick = (entry) => {
    if (!onDrillDown || !entry) return;
    const name = entry.name;
    const col = xAxis;
    if (col && name != null) onDrillDown({ column: col, value: name });
  };

  if (!columns.length) {
    return html`<div className="p-8 text-center text-[var(--app-text-secondary)]">Run a query to see a chart</div>`;
  }

  return html`
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--app-text-secondary)]">Chart type:</span>
          <select
            value=${chartType}
            onChange=${(e) => setChartType(e.target.value)}
            className="px-3 py-1.5 border border-[var(--app-border-soft)] rounded-lg text-sm"
          >
            ${CHART_TYPES.map(t => html`<option key=${t.id} value=${t.id}>${t.label}</option>`)}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--app-text-secondary)]">X-axis:</span>
          <select
            value=${xAxis}
            onChange=${(e) => setXAxis(e.target.value)}
            className="px-3 py-1.5 border border-[var(--app-border-soft)] rounded-lg text-sm"
          >
            ${allColumns.map(c => html`<option key=${c} value=${c}>${c}</option>`)}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--app-text-secondary)]">Y-axis:</span>
          <select
            value=${yAxis}
            onChange=${(e) => setYAxis(e.target.value)}
            className="px-3 py-1.5 border border-[var(--app-border-soft)] rounded-lg text-sm"
          >
            ${allColumns.map(c => html`<option key=${c} value=${c}>${c}</option>`)}
          </select>
        </label>
        ${chartType !== 'pie' ? html`
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--app-text-secondary)]">Group by:</span>
            <select
              value=${groupBy}
              onChange=${(e) => setGroupBy(e.target.value)}
              className="px-3 py-1.5 border border-[var(--app-border-soft)] rounded-lg text-sm"
            >
              <option value="">None</option>
              ${allColumns.map(c => html`<option key=${c} value=${c}>${c}</option>`)}
            </select>
          </label>
        ` : ''}
      </div>

      <div className="h-80 border border-[var(--app-border-soft)] rounded-xl p-4 bg-[var(--app-surface)]">
        ${data.length === 0 ? html`<div className="h-full flex items-center justify-center text-[var(--app-text-muted)]">No data to display</div>` : html`
          <${ResponsiveContainer} width="100%" height="100%">
            ${chartType === 'bar' && html`
              <${BarChart} data=${data}>
                <${CartesianGrid} strokeDasharray="3 3" stroke="#e2e8f0" />
                <${XAxis} dataKey="name" stroke="#64748b" />
                <${YAxis} stroke="#64748b" />
                <${Tooltip} cursor=${onDrillDown ? { fill: 'rgba(59,130,246,0.1)' } : false} />
                <${Legend} />
                ${groupBy ? Object.keys(data[0] || {}).filter(k => k !== 'name').map((k, i) => html`
                  <${Bar} key=${k} dataKey=${k} fill=${COLORS[i % COLORS.length]} name=${k} cursor=${onDrillDown ? 'pointer' : 'default'} onClick=${onDrillDown ? handleBarClick : undefined} />
                `) : html`<${Bar} dataKey="value" fill="#3b82f6" name=${yAxis} cursor=${onDrillDown ? 'pointer' : 'default'} onClick=${onDrillDown ? handleBarClick : undefined} />`}
              <//>
            `}
            ${chartType === 'line' && html`
              <${LineChart} data=${data}>
                <${CartesianGrid} strokeDasharray="3 3" stroke="#e2e8f0" />
                <${XAxis} dataKey="name" stroke="#64748b" />
                <${YAxis} stroke="#64748b" />
                <${Tooltip} />
                <${Legend} />
                ${groupBy ? Object.keys(data[0] || {}).filter(k => k !== 'name').map((k, i) => html`
                  <${Line} key=${k} type="monotone" dataKey=${k} stroke=${COLORS[i % COLORS.length]} name=${k} />
                `) : html`<${Line} type="monotone" dataKey="value" stroke="#3b82f6" name=${yAxis} />`}
              <//>
            `}
            ${chartType === 'pie' && html`
              <${PieChart}>
                <${Pie}
                  data=${pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label=${({ name, value }) => `${name}: ${value}`}
                  onClick=${onDrillDown ? (e) => handlePieClick(e) : undefined}
                >
                  ${pieData.map((entry, i) => html`<${Cell} key=${i} fill=${entry.fill} cursor=${onDrillDown ? 'pointer' : 'default'} />`)}
                <//>
                <${Tooltip} />
                <${Legend} />
              <//>
            `}
            ${chartType === 'area' && html`
              <${AreaChart} data=${data}>
                <${CartesianGrid} strokeDasharray="3 3" stroke="#e2e8f0" />
                <${XAxis} dataKey="name" stroke="#64748b" />
                <${YAxis} stroke="#64748b" />
                <${Tooltip} />
                <${Legend} />
                ${groupBy ? Object.keys(data[0] || {}).filter(k => k !== 'name').map((k, i) => html`
                  <${Area} key=${k} type="monotone" dataKey=${k} stroke=${COLORS[i % COLORS.length]} fill=${COLORS[i % COLORS.length]} fillOpacity={0.4} name=${k} />
                `) : html`<${Area} type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} name=${yAxis} />`}
              <//>
            `}
            ${chartType === 'scatter' && html`
              <${ScatterChart}>
                <${CartesianGrid} strokeDasharray="3 3" stroke="#e2e8f0" />
                <${XAxis} dataKey="name" stroke="#64748b" />
                <${YAxis} stroke="#64748b" />
                <${Tooltip} cursor={{ strokeDasharray: '3 3' }} />
                <${Scatter} name="Data" data=${data} fill="#3b82f6" />
              <//>
            `}
          <//>
        `}
      </div>
    </div>
  `;
};

export default ChartView;
