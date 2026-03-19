import React, { useState, useCallback } from 'react';
import htm from 'htm';
import { addExperience, addMovement as addMovementApi, searchOrganisations } from '/shared/services/index.js';
import IthrasLogo from '/shared/components/IthrasLogo.js';
import MonthYearInput from '/shared/primitives/MonthYearInput.js';
import StatusChip from '/shared/components/StatusChip.js';

const html = htm.bind(React.createElement);

const BLUE_PANEL = '#0C6DFD';
const ACCENT_GOLD = '#FFD700';

const OrganisationCard = ({
  org,
  orgIndex,
  onOrgChange,
  onAddMovement,
  onRemoveMovement,
  onRemoveOrg,
  onOrgSearch,
  organisations,
  onOrgSelect,
  disabled,
}) => {
  const [searchQuery, setSearchQuery] = useState(org.organisationName || '');
  const [showDropdown, setShowDropdown] = useState(false);

  React.useEffect(() => {
    setSearchQuery(org.organisationName || '');
  }, [org.organisationName]);

  return html`
    <div className="app-card p-4 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] space-y-4">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-[var(--app-text-primary)]">Organisation</h4>
        ${onRemoveOrg ? html`
          <button type="button" onClick=${onRemoveOrg} className="text-sm text-[var(--app-danger)] hover:underline" disabled=${disabled}>
            Remove org
          </button>
        ` : null}
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Organisation name</label>
        <input
          type="text"
          value=${searchQuery}
          onChange=${(e) => {
            const v = e.target.value;
            setSearchQuery(v);
            onOrgSearch(v);
            setShowDropdown(true);
            onOrgChange(orgIndex, { organisationName: v, organisationId: null });
          }}
          onFocus=${() => setShowDropdown(true)}
          onBlur=${() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Search or type organisation name"
          disabled=${disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
        ${showDropdown && organisations?.length > 0 ? html`
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            ${organisations.map((o) => html`
              <button
                key=${o.id}
                type="button"
                className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                onMouseDown=${(e) => {
                  e.preventDefault();
                  onOrgSelect(orgIndex, o);
                  setSearchQuery(o.name);
                  setShowDropdown(false);
                }}
              >
                ${o.name}
              </button>
            `)}
          </div>
        ` : null}
      </div>
      <div>
        <h5 className="text-sm font-medium text-gray-700 mb-2">Roles at this organisation</h5>
        ${org.movements.map((mov, mi) => html`
          <div key=${mi} className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Role ${mi + 1}</span>
              ${org.movements.length > 1 ? html`
                <button type="button" onClick=${() => onRemoveMovement(orgIndex, mi)} className="text-xs text-red-600 hover:underline" disabled=${disabled}>
                  Remove
                </button>
              ` : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Business unit"
                value=${mov.businessUnit || ''}
                onChange=${(e) => onOrgChange(orgIndex, {
                  movements: org.movements.map((m, i) => i === mi ? { ...m, businessUnit: e.target.value } : m),
                })}
                disabled=${disabled}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Function"
                value=${mov.function || ''}
                onChange=${(e) => onOrgChange(orgIndex, {
                  movements: org.movements.map((m, i) => i === mi ? { ...m, function: e.target.value } : m),
                })}
                disabled=${disabled}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <input
              type="text"
              placeholder="Title *"
              value=${mov.title || ''}
              onChange=${(e) => onOrgChange(orgIndex, {
                movements: org.movements.map((m, i) => i === mi ? { ...m, title: e.target.value } : m),
                })}
              disabled=${disabled}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <${MonthYearInput}
                label="Start"
                value=${mov.startMonth}
                onChange=${(v) => onOrgChange(orgIndex, {
                  movements: org.movements.map((m, i) => i === mi ? { ...m, startMonth: v } : m),
                })}
                disabled=${disabled}
              />
              <${MonthYearInput}
                label="End"
                value=${mov.endMonth}
                onChange=${(v) => onOrgChange(orgIndex, {
                  movements: org.movements.map((m, i) => i === mi ? { ...m, endMonth: v } : m),
                })}
                endDate=${true}
                disabled=${disabled}
              />
            </div>
            ${mov.status ? html`<div className="flex justify-end"><${StatusChip} status=${mov.status} /></div>` : null}
          </div>
        `)}
        <button
          type="button"
          onClick=${() => onAddMovement(orgIndex)}
          className="text-sm text-[var(--app-accent)] hover:underline"
        >
          + Add role at this organisation
        </button>
      </div>
    </div>
  `;
};

const RegistrationStep3 = ({ onComplete, onBack }) => {
  const [orgs, setOrgs] = useState([
    { organisationName: '', organisationId: null, movements: [{ businessUnit: '', function: '', title: '', startMonth: '', endMonth: '' }] },
  ]);
  const [organisations, setOrganisations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOrgSearch = useCallback((q) => {
    if (!q || q.length < 2) { setOrganisations([]); return; }
    searchOrganisations(q).then((res) => setOrganisations(res?.organisations || [])).catch(() => setOrganisations([]));
  }, []);

  const updateOrg = (orgIdx, data) => {
    setOrgs((prev) => {
      const next = [...prev];
      next[orgIdx] = { ...next[orgIdx], ...data };
      return next;
    });
  };

  const addOrg = () => {
    setOrgs((prev) => [...prev, { organisationName: '', organisationId: null, movements: [{ businessUnit: '', function: '', title: '', startMonth: '', endMonth: '' }] }]);
  };

  const removeOrg = (orgIdx) => {
    if (orgs.length <= 1) return;
    setOrgs((prev) => prev.filter((_, i) => i !== orgIdx));
  };

  const addMovement = (orgIdx) => {
    setOrgs((prev) => {
      const next = [...prev];
      next[orgIdx] = {
        ...next[orgIdx],
        movements: [...next[orgIdx].movements, { businessUnit: '', function: '', title: '', startMonth: '', endMonth: '' }],
      };
      return next;
    });
  };

  const removeMovement = (orgIdx, movIdx) => {
    setOrgs((prev) => {
      const next = [...prev];
      const movs = next[orgIdx].movements;
      if (movs.length <= 1) return prev;
      next[orgIdx] = { ...next[orgIdx], movements: movs.filter((_, i) => i !== movIdx) };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validOrgs = orgs.filter((o) => (o.organisationName || o.organisationId) && o.movements.some((m) => m.title && m.startMonth));
    if (validOrgs.length === 0) {
      setError('Add at least one organisation with at least one role (title and start date required).');
      return;
    }
    for (const o of validOrgs) {
      const validMovs = o.movements.filter((m) => m.title && m.startMonth);
      if (validMovs.length === 0) {
        setError('Each organisation needs at least one role with title and start date.');
        return;
      }
    }
    setLoading(true);
    try {
      for (const o of validOrgs) {
        const res = await addExperience({
          organisation_name: o.organisationName || '',
          organisation_id: o.organisationId || null,
        });
        const egId = res.experience_group_id;
        const validMovs = o.movements.filter((m) => m.title && m.startMonth);
        for (const mov of validMovs) {
          await addMovementApi({
            experience_group_id: egId,
            business_unit: mov.businessUnit || '',
            function: mov.function || '',
            title: mov.title,
            start_month: mov.startMonth,
            end_month: mov.endMonth || null,
          });
        }
      }
      onComplete();
    } catch (err) {
      setError(err.message || 'Failed to save experience.');
    } finally {
      setLoading(false);
    }
  };

  return html`
    <div className="min-h-screen flex bg-[var(--app-bg)]">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-16" style=${{ background: BLUE_PANEL }}>
        <div className="max-w-md text-center">
          <div className="mb-12">
            <${IthrasLogo} size="lg" theme="light" />
          </div>
          <p className="text-[10px] md:text-xs font-semibold tracking-[0.12em] uppercase mb-6" style=${{ color: ACCENT_GOLD }}>
            Step 3 of 3
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Add your experience</h1>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 bg-white overflow-y-auto">
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <${IthrasLogo} size="md" theme="dark" />
        </div>

        <div className="max-w-lg w-full mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-[var(--app-text-muted)]">Step 3 of 3</span>
            <span className="text-gray-400">Experience</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add your professional experience</h2>

          <form onSubmit=${handleSubmit} className="space-y-6">
            ${error ? html`
              <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600 border border-red-100">${error}</div>
            ` : null}
            ${orgs.map((org, orgIdx) => html`
              <${OrganisationCard}
                key=${orgIdx}
                org=${org}
                orgIndex=${orgIdx}
                onOrgChange=${(data) => updateOrg(orgIdx, data)}
                onAddMovement=${() => addMovement(orgIdx)}
                onRemoveMovement=${(_, movIdx) => removeMovement(orgIdx, movIdx)}
                onRemoveOrg=${orgs.length > 1 ? () => removeOrg(orgIdx) : null}
                onOrgSearch=${handleOrgSearch}
                organisations=${organisations}
                onOrgSelect=${(_, o) => { updateOrg(orgIdx, { organisationName: o.name, organisationId: o.id }); }}
                disabled=${loading}
              />
            `)}
            <button
              type="button"
              onClick=${addOrg}
              className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] transition-colors"
            >
              + Add organisation
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick=${onBack}
                className="flex-1 py-3 px-6 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled=${loading}
                className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-[#0C6DFD] hover:bg-[#0A5AD4] disabled:opacity-50"
              >
                ${loading ? 'Saving...' : 'Complete registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
};

export default RegistrationStep3;
