import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const PLACEMENT_VIEWS = ['recruitment_cycles', 'approval-queue', 'policy_approvals', 'master_calendar', 'placement_templates'];
const COMPANY_VIEWS = ['workflows', 'applications'];

function LazyProduct({ loader, props }) {
  const [mod, setMod] = useState(null);
  React.useEffect(() => { loader().then(setMod); }, []);
  if (!mod) return html`<div className="p-20 text-center animate-pulse">Loading...</div>`;
  return props.render(mod);
}

/**
 * SystemAdminShell - routes to the correct module based on view.
 * Loads modules from system-admin subfolders (core, telemetry, analytics, etc.).
 */
const SystemAdminShell = ({ view, navigate, user, activeProfile }) => {
  if (view === 'dashboard') {
    return html`<${LazyProduct}
      loader=${() => import('/products/system-admin/user-management/frontend/index.js')}
      props=${{ render: (mod) => mod.SystemAdminDashboard ? html`<${mod.SystemAdminDashboard} user=${user} navigate=${navigate} />` : html`<div>Loading...</div>` }}
    />`;
  }
  if (view.startsWith('system-admin') || view === 'database') {
    return html`<${LazyProduct}
      loader=${() => import('/products/system-admin/user-management/frontend/index.js')}
      props=${{ render: (mod) => mod.SystemAdminPortal ? html`<${mod.SystemAdminPortal} user=${user} activeProfile=${activeProfile} activeView=${view} navigate=${navigate} />` : html`<div>Loading...</div>` }}
    />`;
  }
  if (view.startsWith('telemetry')) {
    return html`<${LazyProduct}
      loader=${() => import('/products/system-admin/telemetry/frontend/index.js')}
      props=${{ render: (mod) => mod.TelemetryDashboard ? html`<${mod.TelemetryDashboard} activeView=${view} navigate=${navigate} />` : html`<div>Loading...</div>` }}
    />`;
  }
  if (view === 'analytics') {
    return html`<${LazyProduct}
      loader=${() => import('/products/system-admin/analytics/frontend/index.js')}
      props=${{ render: (mod) => mod.AnalyticsPortal ? html`<${mod.AnalyticsPortal} user=${user} activeView=${view} setView=${navigate} />` : html`<div>Loading...</div>` }}
    />`;
  }
  if (view === 'simulator') {
    return html`<${LazyProduct}
      loader=${() => import('/products/system-admin/simulator/frontend/index.js')}
      props=${{ render: (mod) => {
        const Portal = mod.default || mod.SimulatorPortal;
        return Portal ? html`<${Portal} navigate=${navigate} />` : html`<div>Loading...</div>`;
      }}}
    />`;
  }
  if (PLACEMENT_VIEWS.includes(view)) {
    return html`<${LazyProduct}
      loader=${() => import('/products/recruitment-university/frontend/src/modules/governance/index.js')}
      props=${{ render: (mod) => {
        const { AdminPortal, ApprovalQueue } = mod;
        if (view === 'approval-queue' && ApprovalQueue) return html`<${ApprovalQueue} user=${user} />`;
        if (AdminPortal) return html`<${AdminPortal} user=${user} activeView=${view} navigate=${navigate} />`;
        return html`<div className="p-8">Loading...</div>`;
      }}}
    />`;
  }
  if (COMPANY_VIEWS.includes(view)) {
    return html`<${LazyProduct}
      loader=${() => import('/products/profiles/company/frontend/src/index.js')}
      props=${{ render: (mod) => {
        const { RecruiterPortal, CompanyWorkflowView } = mod;
        if (view === 'workflows' && CompanyWorkflowView) return html`<${CompanyWorkflowView} user=${user} />`;
        if (RecruiterPortal) return html`<${RecruiterPortal} user=${user} activeView=${view} />`;
        return html`<div className="p-8">Loading...</div>`;
      }}}
    />`;
  }
  return html`<div className="p-8 text-[var(--app-text-muted)]">Select a module from the sidebar.</div>`;
};

export default SystemAdminShell;
