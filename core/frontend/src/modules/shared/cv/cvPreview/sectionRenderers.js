import React from 'react';
import htm from 'htm';
import { safeString } from './variables.js';
import { extractTrailingYear } from './dateFormatters.js';
import { formatDateRange, formatYearsMonths, parseDurationToMonths, calculateDurationMonths } from './dateFormatters.js';

const html = htm.bind(React.createElement);

/**
 * @param {object} section
 * @param {array} entries
 * @param {object} ctx - { getSectionTitleStyle, displayString, renderBulletText, borderStyle, labelFill, fontSize }
 */
export function renderLabelLeftContentRightTable(section, entries, ctx) {
  const { getSectionTitleStyle, displayString, renderBulletText, borderStyle, labelFill, fontSize } = ctx || {};
  const sectionTitleStyle = getSectionTitleStyle ? getSectionTitleStyle(section) : {};

  const gw = section.gridWidths || {};
  const labelW = gw.label || '17%';
  const bulletsW = gw.bullets || '78%';
  const yearW = gw.year || '5%';

  const getBucketsFromEntry = (entry) => {
    if (section.useDynamicBuckets && Array.isArray(entry.buckets) && entry.buckets.length > 0) {
      return entry.buckets;
    }
    const subs = section.subCategories || [];
    return subs.map(sub => ({
      label: sub.label,
      bullets: entry[sub.fieldId] || []
    }));
  };

  const allBucketRows = [];
  entries.forEach((entry) => {
    const buckets = getBucketsFromEntry(entry);
    buckets.forEach((bucket) => {
      const rawBullets = Array.isArray(bucket.bullets) ? bucket.bullets : [];
      if (rawBullets.length === 0) return;
      const parsed = rawBullets.map(b => extractTrailingYear(b));
      allBucketRows.push({ label: safeString(bucket.label), bullets: parsed });
    });
  });

  if (allBucketRows.length === 0) {
    return html`
      <div key=${section.id}>
        <div style=${sectionTitleStyle}>${displayString ? displayString(section.title) : section.title}</div>
        <div style=${{ fontSize: '7pt', color: '#999', fontStyle: 'italic', padding: '2px 4px', border: borderStyle || '1px solid #000', borderTop: 'none' }}>No entries yet</div>
      </div>
    `;
  }

  const fontNum = fontSize || 8.5;

  return html`
    <div key=${section.id}>
      <div style=${sectionTitleStyle}>${displayString ? displayString(section.title) : section.title}</div>
      <table style=${{ width: '100%', borderCollapse: 'collapse', border: borderStyle || '1px solid #000', borderTop: 'none' }}>
        <tbody>
          ${allBucketRows.map((bucket, bIdx) => {
            const bulletCount = bucket.bullets.length;
            const isLastBucket = bIdx === allBucketRows.length - 1;
            return bucket.bullets.map((b, lineIdx) => {
              const isFirstLine = lineIdx === 0;
              const isLastLine = lineIdx === bulletCount - 1;
              const bulletBorderTop = isFirstLine ? (borderStyle || '1px solid #000') : 'none';
              const bulletBorderBottom = (isLastLine && !isLastBucket) ? (borderStyle || '1px solid #000') : (isLastBucket && isLastLine ? (borderStyle || '1px solid #000') : 'none');
              return html`
              <tr key=${`${bIdx}-${lineIdx}`}>
                ${isFirstLine ? html`
                  <td rowSpan=${bulletCount} style=${{
                    width: labelW,
                    backgroundColor: labelFill || '#D9D9D9',
                    border: borderStyle || '1px solid #000',
                    padding: '2px 4px',
                    fontWeight: 700,
                    fontSize: `${fontNum - 0.5}pt`,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                  }}>
                    ${bucket.label}
                  </td>
                ` : ''}
                <td style=${{
                  width: bulletsW,
                  borderLeft: borderStyle || '1px solid #000',
                  borderRight: borderStyle || '1px solid #000',
                  borderTop: bulletBorderTop,
                  borderBottom: bulletBorderBottom,
                  padding: '1px 4px',
                  fontSize: `${fontNum}pt`,
                  verticalAlign: 'top',
                }}>
                  <div style=${{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style=${{ marginRight: '3px', flexShrink: 0 }}>\u2022</span>
                    <span style=${{ flex: 1 }}>${renderBulletText ? renderBulletText(b.text, true) : b.text}</span>
                  </div>
                </td>
                <td style=${{
                  width: yearW,
                  borderLeft: borderStyle || '1px solid #000',
                  borderRight: borderStyle || '1px solid #000',
                  borderTop: bulletBorderTop,
                  borderBottom: bulletBorderBottom,
                  padding: '1px 3px',
                  fontSize: `${fontNum - 0.5}pt`,
                  textAlign: 'right',
                  verticalAlign: 'top',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                }}>
                  ${b.year}
                </td>
              </tr>
            `;});
          })}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * @param {object} section
 * @param {array} entries
 * @param {object} ctx - { getSectionTitleStyle, displayString, renderBulletText, borderStyle, labelFill, fontSize }
 */
export function renderVerticalLabelGrouped(section, entries, ctx) {
  const { getSectionTitleStyle, displayString, renderBulletText, borderStyle, labelFill, fontSize } = ctx || {};
  const sectionTitleStyle = getSectionTitleStyle ? getSectionTitleStyle(section) : {};

  const groupFieldId = section.verticalLabelFieldId;
  const hdrFields = Array.isArray(section.headerFields) ? section.headerFields : [];
  const gw = section.gridWidths || {};
  const bandW = gw.verticalBand || '2.85%';
  const catLabelW = gw.categoryLabel || '14.1%';
  const bulletsW = gw.bullets || '83%';
  const groupLabelBg = section.groupLabelStyle?.backgroundColor || (labelFill || '#D9D9D9');
  const groupLabelColor = section.groupLabelStyle?.color || '#000';
  const bucketBg = section.entryHeaderBucketStyle?.backgroundColor || (labelFill || '#D9D9D9');

  const groups = {};
  entries.forEach((entry) => {
    const label = safeString(entry[groupFieldId] || entry._groupLabel || 'Other');
    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  });
  const groupLabels = Object.keys(groups);

  const computeTotalDuration = () => {
    if (!section.durationAutoCalculate) return null;
    let totalMonths = 0;
    const fullTimeEntries = entries.filter((entry) => safeString(entry[groupFieldId]).toLowerCase().includes('full'));
    const sourceEntries = fullTimeEntries.length > 0 ? fullTimeEntries : entries;
    sourceEntries.forEach((entry) => {
      const info = parseDurationToMonths(entry, safeString(entry[groupFieldId]));
      if (info) totalMonths += info.months;
    });
    const durationText = formatYearsMonths(totalMonths);
    if (!durationText) return null;
    return `${durationText} (FULL-TIME)`;
  };
  const totalDurationStr = computeTotalDuration();

  const titleBarStyle = totalDurationStr
    ? { ...sectionTitleStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
    : sectionTitleStyle;

  const buildGroupRows = (groupLabel) => {
    const groupEntries = groups[groupLabel];
    const rows = [];
    groupEntries.forEach((entry, entryIdx) => {
      const getVal = (fid) => {
        if (fid === 'duration' && (entry.start_date || entry.end_date)) {
          const range = formatDateRange(entry.start_date, entry.end_date);
          if (range) {
            const months = calculateDurationMonths(entry.start_date, entry.end_date);
            const durText = months != null ? formatYearsMonths(months) : '';
            if (durText) {
              return html`<span>${range}<br/><span style=${{ fontSize: '0.9em', display: 'block' }}>${durText}</span></span>`;
            }
            return range;
          }
        }
        return safeString(entry[fid]);
      };
      const vals = hdrFields.map(fid => getVal(fid)).filter(Boolean);
      if (vals.length > 0) {
        rows.push({ type: 'header', vals, entryIdx });
      }

      const hasAchievementBuckets = Array.isArray(entry.achievementBuckets) && entry.achievementBuckets.length > 0;
      const achievementBuckets = hasAchievementBuckets ? entry.achievementBuckets : (
        Array.isArray(entry.achievements) && entry.achievements.length > 0
          ? [{ label: 'Key Achievements', bullets: entry.achievements }]
          : []
      );
      achievementBuckets.forEach((bucket) => {
        const rawBullets = Array.isArray(bucket.bullets) ? bucket.bullets : [];
        if (rawBullets.length === 0) return;
        const parsed = rawBullets.map(b => {
          const isObj = typeof b === 'object' && b !== null;
          const str = isObj && b.text != null ? safeString(b.text) : safeString(b);
          return { text: str, proofUrl: isObj ? b.proofUrl : null };
        });
        rows.push({ type: 'bucket', label: safeString(bucket.label), bullets: parsed });
      });
    });
    return rows;
  };

  if (groupLabels.length === 0) {
    return html`
      <div key=${section.id}>
        <div style=${titleBarStyle}>
          <span>${displayString ? displayString(section.title) : section.title}</span>
          ${totalDurationStr ? html`<span style=${{ fontSize: `${(fontSize || 8.5) - 0.5}pt`, fontWeight: 700, whiteSpace: 'nowrap' }}>${totalDurationStr}</span>` : ''}
        </div>
        <div style=${{ fontSize: '7pt', color: '#999', fontStyle: 'italic', padding: '2px 4px', border: borderStyle || '1px solid #000', borderTop: 'none' }}>No entries yet</div>
      </div>
    `;
  }

  const allGroupData = groupLabels.map(gl => ({ label: gl, rows: buildGroupRows(gl) }));
  const fontNum = fontSize || 8.5;
  const bord = borderStyle || '1px solid #000';
  const lblFill = labelFill || '#D9D9D9';

  const countGroupTableRows = (rows) => {
    let count = 0;
    rows.forEach(r => {
      if (r.type === 'header') count += 1;
      else count += r.bullets.length;
    });
    return count;
  };

  return html`
    <div key=${section.id}>
      <div style=${titleBarStyle}>
        <span>${displayString ? displayString(section.title) : section.title}</span>
        ${totalDurationStr ? html`<span style=${{ fontSize: `${fontNum - 0.5}pt`, fontWeight: 700, whiteSpace: 'nowrap' }}>${totalDurationStr}</span>` : ''}
      </div>
      <table style=${{ width: '100%', borderCollapse: 'collapse', border: bord, borderTop: 'none' }}>
        <tbody>
          ${allGroupData.map((gd, gIdx) => {
            const groupRowCount = countGroupTableRows(gd.rows);
            let isFirstRow = true;
            return gd.rows.map((row, rIdx) => {
              if (row.type === 'header') {
                const last = row.vals.length > 1 ? row.vals[row.vals.length - 1] : null;
                const rest = last ? row.vals.slice(0, -1) : row.vals;
                const el = html`
                  <tr key=${`g${gIdx}-h${rIdx}`}>
                    ${isFirstRow ? html`
                      <td rowSpan=${groupRowCount} style=${{
                        width: bandW,
                        backgroundColor: groupLabelBg,
                        border: bord,
                        padding: '2px 0',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        position: 'relative',
                      }}>
                        <div style=${{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          fontSize: '6.5pt',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.5px',
                          color: groupLabelColor,
                        }}>
                          ${gd.label}
                        </div>
                      </td>
                    ` : ''}
                    <td colSpan=${2} style=${{
                      backgroundColor: bucketBg,
                      border: bord,
                      padding: '2px 4px',
                      fontSize: `${fontNum}pt`,
                    }}>
                      <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div>
                          ${rest.map((v, i) => html`<span key=${i} style=${{ fontWeight: i === 0 ? 800 : 600, textTransform: i === 0 ? 'uppercase' : 'none', marginRight: '12px' }}>${v}</span>`)}
                        </div>
                        ${last ? html`<span style=${{ fontSize: `${fontNum - 0.5}pt`, fontWeight: 600, whiteSpace: React.isValidElement(last) ? 'normal' : 'nowrap' }}>${last}</span>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
                isFirstRow = false;
                return el;
              }
              return row.bullets.map((b, lineIdx) => {
                const isFirstBullet = lineIdx === 0;
                const isLastBullet = lineIdx === row.bullets.length - 1;
                const bBorderTop = isFirstBullet ? bord : 'none';
                const bBorderBottom = isLastBullet ? bord : 'none';
                const el = html`
                  <tr key=${`g${gIdx}-b${rIdx}-${lineIdx}`}>
                    ${isFirstRow ? html`
                      <td rowSpan=${groupRowCount} style=${{
                        width: bandW,
                        backgroundColor: groupLabelBg,
                        border: bord,
                        padding: '2px 0',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                      }}>
                        <div style=${{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          fontSize: '6.5pt',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.5px',
                          color: groupLabelColor,
                        }}>
                          ${gd.label}
                        </div>
                      </td>
                    ` : ''}
                    ${isFirstBullet ? html`
                      <td rowSpan=${row.bullets.length} style=${{
                        width: catLabelW,
                        backgroundColor: lblFill,
                        border: bord,
                        padding: '2px 4px',
                        fontWeight: 700,
                        fontSize: `${fontNum - 0.5}pt`,
                        textAlign: 'center',
                        verticalAlign: 'middle',
                      }}>
                        ${row.label}
                      </td>
                    ` : ''}
                    <td style=${{
                      width: bulletsW,
                      borderLeft: bord,
                      borderRight: bord,
                      borderTop: bBorderTop,
                      borderBottom: bBorderBottom,
                      padding: '1px 4px',
                      fontSize: `${fontNum}pt`,
                      verticalAlign: 'top',
                    }}>
                      <div style=${{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style=${{ marginRight: '3px', flexShrink: 0 }}>\u2022</span>
                        <span style=${{ flex: 1 }}>${renderBulletText ? renderBulletText(b.text, true) : b.text}</span>
                      </div>
                    </td>
                  </tr>
                `;
                isFirstRow = false;
                return el;
              });
            });
          })}
        </tbody>
      </table>
    </div>
  `;
}
