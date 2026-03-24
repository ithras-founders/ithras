import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { Login, RegistrationFlow, useAuth } from '/core/auth/frontend/index.js';
import { SetupScreen, useSetup } from '/core/setup/frontend/index.js';
import ProfessionalProfileView from '/products/profiles/professional/frontend/ProfessionalProfileView.js';
import PublicProfileView from '/products/profiles/professional/frontend/PublicProfileView.js';
import AboutInstitutionPage from '/products/profiles/professional/frontend/AboutInstitutionPage.js';
import AboutCompanyPage from '/products/profiles/professional/frontend/AboutCompanyPage.js';
import AdminLayout from '/admin/frontend/src/AdminLayout.js';
import InstitutionManagement from '/admin/frontend/src/InstitutionManagement.js';
import InstitutionAdminBoard from '/admin/frontend/src/InstitutionAdminBoard.js';
import OrganisationManagement from '/admin/frontend/src/OrganisationManagement.js';
import OrganisationAdminBoard from '/admin/frontend/src/OrganisationAdminBoard.js';
import UserManagement from '/admin/frontend/src/UserManagement.js';
import CommunityManagement from '/admin/frontend/src/community/CommunityManagement.js';
import CommunityDetailPage from '/admin/frontend/src/community/CommunityDetailPage.js';
import CommunityCreatePage from '/admin/frontend/src/community/CommunityCreatePage.js';
import CommunityRequestList from '/admin/frontend/src/community/CommunityRequestList.js';
import ChannelRequestList from '/admin/frontend/src/community/ChannelRequestList.js';
import TelemetryOverview from '/admin/frontend/src/telemetry/TelemetryOverview.js';
import ApiTelemetryPage from '/admin/frontend/src/telemetry/sections/ApiTelemetryPage.js';
import UserActivityPage from '/admin/frontend/src/telemetry/sections/UserActivityPage.js';
import AuditLogsPage from '/admin/frontend/src/telemetry/sections/AuditLogsPage.js';
import SecurityPage from '/admin/frontend/src/telemetry/sections/SecurityPage.js';
import SocialTelemetryPage from '/admin/frontend/src/telemetry/sections/SocialTelemetryPage.js';
import NetworkTelemetryPage from '/admin/frontend/src/telemetry/sections/NetworkTelemetryPage.js';
import EntityChangeHistoryPage from '/admin/frontend/src/telemetry/sections/EntityChangeHistoryPage.js';
import JobsPage from '/admin/frontend/src/telemetry/sections/JobsPage.js';
import ErrorsPage from '/admin/frontend/src/telemetry/sections/ErrorsPage.js';
import SearchTelemetryPage from '/admin/frontend/src/telemetry/sections/SearchTelemetryPage.js';
import ModerationPage from '/admin/frontend/src/telemetry/sections/ModerationPage.js';
import CompliancePage from '/admin/frontend/src/telemetry/sections/CompliancePage.js';
import FeedView from '/products/feed/frontend/index.js';
import NetworkView from '/products/network/frontend/index.js';
import MessagingView from '/products/messaging/frontend/index.js';
import AboutUsPage from '/core/app/frontend/src/AboutUsPage.js';
import PendingApprovalPage from '/core/auth/frontend/pages/PendingApprovalPage.js';
import SearchPage from '/shared/components/search/SearchPage.js';
import PreparationView from '/products/preparation/frontend/index.js';
import LongFormView from '/products/longform/frontend/index.js';
import PublicLongFormPostShell from '/products/longform/frontend/src/PublicLongFormPostShell.js';
import JobsComingSoonView from '/core/app/frontend/src/JobsComingSoonView.js';

const html = htm.bind(React.createElement);

const App = () => {
  const { setupStatus, showSetup, setupError } = useSetup();
  const { user, handleLogin, handleLogout } = useAuth();
  const [, setPathKey] = useState(0);
  useEffect(() => {
    const handler = () => setPathKey((k) => k + 1);
    window.addEventListener('popstate', handler);
    window.addEventListener('ithras:path-changed', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('ithras:path-changed', handler);
    };
  }, []);

  let path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (path === '/prepare/longform' || path.startsWith('/prepare/longform/')) {
    const suffix = path.replace(/^\/prepare\/longform/, '') || '';
    window.history.replaceState(null, '', `/longform${suffix}`);
    path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
  }

  if (showSetup) {
    return html`<${SetupScreen}
      status=${setupStatus?.status}
      message=${setupStatus?.message}
      phase=${setupStatus?.phase}
      currentStep=${setupStatus?.current_step ?? 0}
      totalSteps=${setupStatus?.total_steps ?? 0}
      steps=${setupStatus?.steps ?? []}
      progressPercent=${setupStatus?.progress_percent}
      dbUnreachable=${setupStatus?.db_unreachable ?? false}
      onRetry=${setupError ? () => window.location.reload() : undefined}
    />`;
  }

  // Public profile: if logged-in user viewing own profile, show editable view
  const pMatch = path.match(/^\/p\/([^/]+)$/);
  if (pMatch) {
    const slug = pMatch[1];
    const isOwnProfile = user?.user_type === 'professional' && (user?.profile_slug === slug);
    if (isOwnProfile) {
      return html`<${ProfessionalProfileView} user=${user} onLogout=${handleLogout} />`;
    }
    return html`<${PublicProfileView} slug=${slug} user=${user} onLogout=${handleLogout} />`;
  }

  // Other public pages (no auth required)
  const iMatch = path.match(/^\/i\/([^/]+)$/);
  const oMatch = path.match(/^\/o\/([^/]+)$/);
  if (iMatch) {
    return html`<${AboutInstitutionPage} slug=${iMatch[1]} user=${user} onLogout=${handleLogout} />`;
  }
  if (oMatch) {
    return html`<${AboutCompanyPage} slug=${oMatch[1]} user=${user} onLogout=${handleLogout} />`;
  }

  if (path === '/about') return html`<${AboutUsPage} user=${user} onLogout=${handleLogout} />`;

  const longformPublicPostMatch = path.match(/^\/longform\/p\/([^/]+)\/([^/]+)$/);
  if (!user && longformPublicPostMatch) {
    return html`<${PublicLongFormPostShell}
      publicationSlug=${longformPublicPostMatch[1]}
      postSlug=${longformPublicPostMatch[2]}
    />`;
  }

  if (!user) {
    if (path === '/pending-approval') {
      return html`<${PendingApprovalPage} onBack=${() => { window.location.href = '/'; }} />`;
    }
    const showRegister = path === '/register' || path.startsWith('/register');
    if (showRegister) {
      return html`
        <${RegistrationFlow}
          user=${null}
          onStep1Success=${(res) => handleLogin(res, { redirectTo: '/register/education', hardRedirect: true })}
          onComplete=${() => { window.location.href = '/pending-approval'; }}
          onShowLogin=${() => { window.location.href = '/'; }}
        />
      `;
    }
    return html`<${Login} onLogin=${handleLogin} onShowRegister=${() => { window.location.href = '/register'; }} />`;
  }

  // Professional users in registration flow (steps 2–3) — allow before pending check so they can complete profile
  if (user?.user_type === 'professional' && (path === '/register' || path === '/register/education' || path === '/register/experience')) {
    return html`
      <${RegistrationFlow}
        user=${user}
        onStep1Success=${() => {}}
        onComplete=${() => { window.location.href = '/pending-approval'; }}
        onShowLogin=${null}
      />
    `;
  }

  // Block pending/rejected professional users from all authenticated content
  if (user?.user_type === 'professional') {
    const accountStatus = user?.account_status;
    if (accountStatus === 'pending' || accountStatus === 'rejected') {
      if (path !== '/pending-approval') {
        window.history.replaceState(null, '', '/pending-approval');
        window.dispatchEvent(new CustomEvent('ithras:path-changed'));
      }
      return html`<${PendingApprovalPage} accountStatus=${accountStatus} onBack=${() => { handleLogout(); }} />`;
    }
  }

  // Feed (requires auth)
  if (path === '/feed' || path.startsWith('/feed/')) {
    return html`<${FeedView} user=${user} onLogout=${handleLogout} />`;
  }

  // Network (requires auth)
  if (path === '/network' || path.startsWith('/network/')) {
    return html`<${NetworkView} user=${user} onLogout=${handleLogout} />`;
  }

  // Messages (requires auth)
  if (path === '/messages' || path.startsWith('/messages/')) {
    return html`<${MessagingView} user=${user} onLogout=${handleLogout} />`;
  }

  if (path === '/search') {
    return html`<${SearchPage} user=${user} onLogout=${handleLogout} />`;
  }

  if (path === '/prepare' || path.startsWith('/prepare/')) {
    return html`<${PreparationView} user=${user} onLogout=${handleLogout} />`;
  }

  if (path === '/longform' || path.startsWith('/longform/')) {
    return html`<${LongFormView} user=${user} onLogout=${handleLogout} />`;
  }

  if (path === '/jobs' || path.startsWith('/jobs/')) {
    return html`<${JobsComingSoonView} user=${user} onLogout=${handleLogout} />`;
  }

  // Admin users go to admin area
  if (user?.user_type === 'admin') {
    if (
      !path.startsWith('/admin') &&
      path !== '/search' &&
      path !== '/prepare' &&
      !path.startsWith('/prepare/') &&
      path !== '/longform' &&
      !path.startsWith('/longform/') &&
      path !== '/jobs' &&
      !path.startsWith('/jobs/')
    ) {
      window.location.replace('/admin/institutions');
      return html`<div className="p-8">Redirecting...</div>`;
    }
    const adminTab = path.includes('/organisations') ? 'organisations' : path.includes('/users') ? 'users' : path.includes('/communities') || path.includes('/community-requests') || path.includes('/channel-requests') ? 'communities' : 'institutions';
    const instEditMatch = path.match(/^\/admin\/institutions\/(\d+)$/);
    const orgEditMatch = path.match(/^\/admin\/organisations\/(\d+)$/);
    const communityDetailMatch = path.match(/^\/admin\/communities\/(\d+)$/);
    const communityNewMatch = path.match(/^\/admin\/communities\/new$/);
    const communityRequestsMatch = path.match(/^\/admin\/community-requests$/);
    const channelRequestsMatch = path.match(/^\/admin\/channel-requests$/);
    const goBackInstitutions = () => { window.history.pushState(null, '', '/admin/institutions'); window.dispatchEvent(new CustomEvent('ithras:path-changed')); };
    const goBackOrganisations = () => { window.history.pushState(null, '', '/admin/organisations'); window.dispatchEvent(new CustomEvent('ithras:path-changed')); };
    const goBackCommunities = () => { window.history.pushState(null, '', '/admin/communities'); window.dispatchEvent(new CustomEvent('ithras:path-changed')); };
    if (instEditMatch) {
      return html`
        <${AdminLayout} activeTab="institutions" user=${user} onLogout=${handleLogout}>
          <${InstitutionAdminBoard} institutionId=${parseInt(instEditMatch[1], 10)} onBack=${goBackInstitutions} />
        </${AdminLayout}>
      `;
    }
    if (orgEditMatch) {
      return html`
        <${AdminLayout} activeTab="organisations" user=${user} onLogout=${handleLogout}>
          <${OrganisationAdminBoard} organisationId=${parseInt(orgEditMatch[1], 10)} onBack=${goBackOrganisations} />
        </${AdminLayout}>
      `;
    }
    if (communityDetailMatch) {
      return html`
        <${AdminLayout} activeTab="communities" user=${user} onLogout=${handleLogout}>
          <${CommunityDetailPage} communityId=${parseInt(communityDetailMatch[1], 10)} onBack=${goBackCommunities} />
        </${AdminLayout}>
      `;
    }
    if (communityNewMatch) {
      return html`
        <${AdminLayout} activeTab="communities" user=${user} onLogout=${handleLogout}>
          <${CommunityCreatePage} onBack=${goBackCommunities} />
        </${AdminLayout}>
      `;
    }
    if (communityRequestsMatch) {
      return html`
        <${AdminLayout} activeTab="communities" user=${user} onLogout=${handleLogout}>
          <${CommunityRequestList} onNavigateToCommunity=${(id) => { window.history.pushState(null, '', `/admin/communities/${id}`); window.dispatchEvent(new CustomEvent('ithras:path-changed')); }} />
        </${AdminLayout}>
      `;
    }
    if (channelRequestsMatch) {
      return html`
        <${AdminLayout} activeTab="communities" user=${user} onLogout=${handleLogout}>
          <${ChannelRequestList} onNavigateToCommunity=${(id) => { window.history.pushState(null, '', `/admin/communities/${id}`); window.dispatchEvent(new CustomEvent('ithras:path-changed')); }} />
        </${AdminLayout}>
      `;
    }
    if (path === '/admin/technology' || path === '/admin/technology/') {
      window.location.replace('/admin/technology/overview');
      return html`<div className="p-8">Redirecting...</div>`;
    }
    if (path === '/admin/technology/overview') {
      return html`
        <${AdminLayout} user=${user} onLogout=${handleLogout}>
          <${TelemetryOverview} />
        </${AdminLayout}>
      `;
    }
    if (path === '/admin/technology/api') {
      return html`
        <${AdminLayout} user=${user} onLogout=${handleLogout}>
          <${ApiTelemetryPage} />
        </${AdminLayout}>
      `;
    }
    if (path === '/admin/technology/user-activity') {
      return html`
        <${AdminLayout} user=${user} onLogout=${handleLogout}>
          <${UserActivityPage} />
        </${AdminLayout}>
      `;
    }
    if (path === '/admin/technology/audit') {
      return html`
        <${AdminLayout} user=${user} onLogout=${handleLogout}>
          <${AuditLogsPage} />
        </${AdminLayout}>
      `;
    }
    if (path === '/admin/technology/security') {
      return html`
        <${AdminLayout} user=${user} onLogout=${handleLogout}>
          <${SecurityPage} />
        </${AdminLayout}>
      `;
    }
    if (path === '/admin/technology/social') {
      return html`
        <${AdminLayout} user=${user} onLogout=${handleLogout}>
          <${SocialTelemetryPage} />
        </${AdminLayout}>
      `;
    }
    if (path === '/admin/technology/network') {
      return html`
        <${AdminLayout} user=${user} onLogout=${handleLogout}>
          <${NetworkTelemetryPage} />
        </${AdminLayout}>
      `;
    }
    if (path === '/admin/technology/entity-history') {
      return html`
        <${AdminLayout} user=${user} onLogout=${handleLogout}>
          <${EntityChangeHistoryPage} />
        </${AdminLayout}>
      `;
    }
    if (path === '/admin/technology/jobs') {
      return html`
        <${AdminLayout} user=${user} onLogout=${handleLogout}>
          <${JobsPage} />
        </${AdminLayout}>
      `;
    }
    if (path === '/admin/technology/errors') {
      return html`
        <${AdminLayout} user=${user} onLogout=${handleLogout}>
          <${ErrorsPage} />
        </${AdminLayout}>
      `;
    }
    if (path === '/admin/technology/search') {
      return html`
        <${AdminLayout} user=${user} onLogout=${handleLogout}>
          <${SearchTelemetryPage} />
        </${AdminLayout}>
      `;
    }
    if (path === '/admin/technology/moderation') {
      return html`
        <${AdminLayout} user=${user} onLogout=${handleLogout}>
          <${ModerationPage} />
        </${AdminLayout}>
      `;
    }
    if (path === '/admin/technology/compliance') {
      return html`
        <${AdminLayout} user=${user} onLogout=${handleLogout}>
          <${CompliancePage} />
        </${AdminLayout}>
      `;
    }
    const AdminContent = adminTab === 'organisations' ? OrganisationManagement : adminTab === 'users' ? UserManagement : adminTab === 'communities' ? CommunityManagement : InstitutionManagement;
    return html`
      <${AdminLayout} activeTab=${adminTab} user=${user} onLogout=${handleLogout}>
        <${AdminContent} />
      </${AdminLayout}>
    `;
  }

  // Professional users default to feed
  if (user?.user_type === 'professional') {
    window.history.replaceState(null, '', '/feed');
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    return html`<${FeedView} user=${user} onLogout=${handleLogout} />`;
  }

  return html`
    <${ProfessionalProfileView}
      user=${user}
      onLogout=${handleLogout}
    />
  `;
};

export default App;
