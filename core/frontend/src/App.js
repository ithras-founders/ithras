import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { UserRole } from './modules/shared/types.js';
import { Layout, SetupScreen, toDisplayString } from './modules/shared/index.js';
import ErrorBoundary from './modules/shared/components/ErrorBoundary.js';
import { Login, Register } from './modules/auth/index.js';
import { productRegistry } from './productRegistry.js';
import { recordPageView, flushTelemetry } from './modules/shared/services/telemetry.js';
import { deriveRoleFlags } from './modules/shared/permissions.js';
import { resolveProduct } from './routeConfig.js';
import { AppProvider, useApp } from './modules/shared/context/AppContext.js';
import { useSetup } from './hooks/useSetup.js';
import { useViewRouter } from './hooks/useViewRouter.js';
import { useAuth } from './hooks/useAuth.js';
import InvestorPitchDeck from './modules/investor/InvestorPitchDeck.js';
import InstitutionPitchDeck from './modules/investor/InstitutionPitchDeck.js';
import UniversityInvestorPitchDeck from './modules/investor/UniversityInvestorPitchDeck.js';
import RecruitmentInvestorPitchDeck from './modules/investor/RecruitmentInvestorPitchDeck.js';
import AboutUsPage from './modules/shared/pages/AboutUsPage.js';
import IthrasLogo from './modules/shared/components/IthrasLogo.js';

const html = htm.bind(React.createElement);

const App = () => {
  const { setupStatus, showSetup, setupError } = useSetup();
  const { view, setView, navigate } = useViewRouter();
  const {
    user, profiles, activeProfile,
    handleLogin, handleLogout,
    handleSwitchProfile, handleUserUpdate,
  } = useAuth(navigate, setView);
  const [rightUtilityBarOpen, setRightUtilityBarOpen] = useState(true);

  const viewEntryRef = useRef({ view, product: null, ts: Date.now() });

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

  const pathname = window.location.pathname?.replace(/\/+$/, '') || '';
  if (pathname === '/investor_pitch' || pathname === '/investor-deck') {
    return html`<${InvestorPitchDeck} onExit=${() => { window.location.href = '/'; }} />`;
  }
  if (pathname === '/institution_pitch' || pathname === '/institution-deck') {
    return html`<${InstitutionPitchDeck} onExit=${() => { window.location.href = '/'; }} />`;
  }
  if (pathname === '/investor_pitch_university' || pathname === '/investor-deck-university') {
    return html`<${UniversityInvestorPitchDeck} onExit=${() => { window.location.href = '/'; }} />`;
  }
  if (pathname === '/investor_pitch_recruitment' || pathname === '/investor-deck-recruitment') {
    return html`<${RecruitmentInvestorPitchDeck} onExit=${() => { window.location.href = '/'; }} />`;
  }

  if (!user) {
    const unauthPath = window.location.pathname?.replace(/\/+$/, '') || '';
    const showRegister = unauthPath === '/register';
    const showAboutUs = unauthPath === '/about-us';
    if (showAboutUs) {
      return html`
        <div className="min-h-screen flex flex-col bg-[var(--app-bg)]">
          <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--app-border-soft)] bg-[var(--app-surface)]">
            <a href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <${IthrasLogo} size="sm" theme="dark" />
            </a>
            <div className="flex items-center gap-4">
              <a href="mailto:hello@ithras.io" className="text-sm font-medium text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)] transition-colors">Contact</a>
              <a href="/" className="text-sm font-medium text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)] transition-colors">Back to Sign in</a>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <${AboutUsPage} />
          </main>
        </div>
      `;
    }
    if (showRegister) {
      return html`<${Register} onRegister=${handleLogin} onBack=${() => { window.location.href = '/'; }} />`;
    }
    return html`<${Login} onLogin=${handleLogin} onGoToRegister=${() => { window.location.href = '/register'; }} onGoToAboutUs=${() => { window.location.href = '/about-us'; }} />`;
  }

  const appCtx = { user, profiles, activeProfile, navigate, onSwitchProfile: handleSwitchProfile, onLogout: handleLogout, onUserUpdate: handleUserUpdate, rightUtilityBarOpen, setRightUtilityBarOpen };

  return html`
    <${AppProvider} value=${appCtx}>
      <${AppBody}
        view=${view}
        navigate=${navigate}
        viewEntryRef=${viewEntryRef}
      />
    <//>
  `;
};

const AppBody = ({ view, navigate, viewEntryRef }) => {
  const { user, profiles, activeProfile, onSwitchProfile, onLogout, onUserUpdate } = useApp();
  const nav = navigate;
  const displayUser = user;

  const resolveRoleId = (r) => (r && typeof r === 'object' && r.id) ? r.id : (r || '');
  const displayRoleId = resolveRoleId(displayUser?.role);
  const roleFlags = activeProfile ? deriveRoleFlags(activeProfile, { profiles }) : (() => {
    const isCandidateOrProfessional = displayRoleId === 'CANDIDATE' || displayRoleId === 'PROFESSIONAL';
    const institutionId = displayUser?.institution_id ?? displayUser?.institution?.id;
    const isSystemAdmin = displayRoleId === 'SYSTEM_ADMIN';
    const isGovernanceUser = [UserRole.FACULTY_OBSERVER, UserRole.PLACEMENT_TEAM, UserRole.PLACEMENT_ADMIN, UserRole.INSTITUTION_ADMIN].includes(displayRoleId);
    const isPlacementTeam = [UserRole.PLACEMENT_TEAM, UserRole.PLACEMENT_ADMIN].includes(displayRoleId);
    const isRestrictedUser = !isSystemAdmin && !isGovernanceUser && !isPlacementTeam && !isCandidateOrProfessional && displayRoleId !== 'RECRUITER';
    return {
      isSystemAdmin,
      isCandidate: isCandidateOrProfessional,
      isRecruiter: displayRoleId === 'RECRUITER',
      isProfessional: displayRoleId === 'PROFESSIONAL',
      isGovernanceUser,
      isInstitutionAdmin: displayRoleId === 'INSTITUTION_ADMIN',
      isPlacementTeam,
      isGeneralUser: isCandidateOrProfessional && !institutionId,
      isRestrictedUser,
      isInstitutionallyRestrictedCandidate: false,
      isLimitedRecruiter: false,
    };
  })();

  const activeProduct = displayUser ? resolveProduct(view, roleFlags) : null;

  const [loadedModule, setLoadedModule] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prev = viewEntryRef.current;
    if (prev.view && (prev.view !== view || prev.product !== activeProduct)) {
      const duration_ms = Date.now() - prev.ts;
      if (duration_ms > 100) {
        recordPageView({ view: prev.view, product: prev.product || '', duration_ms });
      }
    }
    viewEntryRef.current = { view, product: activeProduct, ts: Date.now() };
  }, [view, activeProduct, viewEntryRef]);

  useEffect(() => {
    return () => {
      const prev = viewEntryRef.current;
      if (prev?.view) {
        const duration_ms = Date.now() - (prev.ts || Date.now());
        if (duration_ms > 100) {
          recordPageView({ view: prev.view, product: prev.product || '', duration_ms });
        }
      }
      flushTelemetry();
    };
  }, []);

  useEffect(() => {
    if (!activeProduct || !productRegistry[activeProduct]) {
      setLoadedModule(null);
      return;
    }
    setLoading(true);
    productRegistry[activeProduct]()
      .then((mod) => { setLoadedModule(mod); setLoading(false); })
      .catch((err) => { console.error(`Failed to load product ${activeProduct}:`, err); setLoadedModule(null); setLoading(false); });
  }, [activeProduct]);

  const isGovernanceUser = roleFlags.isGovernanceUser;

  const renderWithLayout = (children) => html`
    <${ErrorBoundary}>
      <${Layout}
        user=${displayUser}
        activeView=${view}
        navigate=${nav}
      >
        ${children}
      <//>
    <//>
  `;

  if (loading) return renderWithLayout(html`<div className="p-20 text-center animate-pulse">Loading...</div>`);

  if (view === 'about-us') {
    return renderWithLayout(html`<${AboutUsPage} />`);
  }

  if (activeProduct === 'calendar-management' && loadedModule) {
    const { CompanyCalendarView, StudentCalendarView } = loadedModule || {};
    const CalView = displayUser.role === UserRole.CANDIDATE ? StudentCalendarView : displayUser.role === UserRole.RECRUITER ? CompanyCalendarView : null;
    return renderWithLayout(CalView ? html`<${CalView} user=${displayUser} />` : html`<div className="p-20 text-center">Calendar scheduling is available for candidates and recruiters only.</div>`);
  }

  if (activeProduct === 'cv-templates-viewer' && loadedModule) {
    const { CVTemplatesViewer } = loadedModule || {};
    if (!CVTemplatesViewer) return renderWithLayout(html`<div className="p-20 text-center">Loading...</div>`);
    return renderWithLayout(html`<${CVTemplatesViewer} user=${displayUser} />`);
  }

  if (activeProduct === 'cv-maker' && loadedModule) {
    const { CVMakerPortal } = loadedModule || {};
    if (!CVMakerPortal) return renderWithLayout(html`<div className="p-20 text-center">Loading...</div>`);
    return renderWithLayout(html`<${CVMakerPortal} user=${displayUser} />`);
  }

  if (activeProduct === 'cv-verification' && loadedModule) {
    const { CVVerificationModule } = loadedModule || {};
    if (!CVVerificationModule) return renderWithLayout(html`<div className="p-20 text-center">Loading...</div>`);
    return renderWithLayout(html`<${CVVerificationModule} user=${displayUser} />`);
  }

  if (activeProduct === 'preparation' && (roleFlags.isCandidate || roleFlags.isRestrictedUser) && loadedModule) {
    const { PreparationPortal } = loadedModule || {};
    if (!PreparationPortal) return renderWithLayout(html`<div className="p-20 text-center">Loading...</div>`);
    return renderWithLayout(html`<${PreparationPortal} user=${displayUser} view=${view} navigate=${nav} />`);
  }

  if (activeProduct === 'feed' && (roleFlags.isGeneralUser || roleFlags.isCandidate || roleFlags.isRecruiter || roleFlags.isRestrictedUser) && loadedModule) {
    const { GeneralFeedPortal } = loadedModule || {};
    if (!GeneralFeedPortal) return renderWithLayout(html`<div className="p-20 text-center">Loading...</div>`);
    return renderWithLayout(html`<${GeneralFeedPortal} user=${displayUser} view=${view} navigate=${nav} profiles=${profiles} activeProfile=${activeProfile} onSwitchProfile=${onSwitchProfile} />`);
  }

  if (activeProduct === 'candidates' && loadedModule) {
    const { CandidatePortal, ApplicationSubmission, CandidateProfileView } = loadedModule || {};
    if (view.startsWith('candidate/')) {
      const candidateId = view.split('/')[1];
      return renderWithLayout(
        CandidateProfileView ? html`<${CandidateProfileView} candidateId=${candidateId} user=${displayUser} navigate=${nav} />` : html`<div className="p-20 text-center">Loading...</div>`
      );
    }
    if (roleFlags.isCandidate) {
      return renderWithLayout(html`
        ${['dashboard', 'active_processes', 'intelligence'].includes(view) && CandidatePortal ? html`<${CandidatePortal} user=${displayUser} activeSubView=${view} setView=${nav} />`
          : view === 'applications' && ApplicationSubmission ? html`<${ApplicationSubmission} user=${displayUser} />`
          : html`<div className="p-20 text-center font-semibold text-[var(--app-text-muted)] text-3xl italic">Engagement Registry Node Initializing...</div>`}
      `);
    }
  }

  if (activeProduct === 'recruitment-lateral' && (roleFlags.isRecruiter || roleFlags.isProfessional) && loadedModule) {
    const { RecruitmentPortal } = loadedModule || {};
    return renderWithLayout(
      RecruitmentPortal ? html`<${RecruitmentPortal} user=${displayUser} activeView=${view} navigate=${nav} />` : html`<div className="p-20 text-center">Loading...</div>`
    );
  }

  if (activeProduct === 'recruitment-university' && loadedModule) {
    const { AdminPortal, ApprovalQueue } = loadedModule || {};
    return renderWithLayout(html`
      ${isGovernanceUser ? html`
        ${view === 'approval-queue' && ApprovalQueue ? html`<${ApprovalQueue} user=${displayUser} />`
          : AdminPortal ? html`<${AdminPortal} user=${displayUser} activeView=${view} navigate=${nav} />`
          : html`<div className="p-20 text-center">Module loading...</div>`}
      ` : html`<div className="p-20 text-center animate-in">Node Access Restricted.</div>`}
    `);
  }

  if (activeProduct === 'institution-management' && roleFlags.isInstitutionAdmin && loadedModule) {
    const InstitutionAdminPortal = loadedModule?.default;
    if (!InstitutionAdminPortal) return renderWithLayout(html`<div className="p-20 text-center">Loading...</div>`);
    return renderWithLayout(html`<${InstitutionAdminPortal} user=${displayUser} activeView=${view} />`);
  }

  if (activeProduct === 'company-management' && roleFlags.isSystemAdmin && loadedModule) {
    const CompanyForm = loadedModule?.CompanyForm || loadedModule?.default;
    if (!CompanyForm) return renderWithLayout(html`<div className="p-20 text-center">Loading...</div>`);
    return renderWithLayout(html`<div className="p-8"><${CompanyForm} /></div>`);
  }

  if (activeProduct === 'system-admin' && roleFlags.isSystemAdmin && loadedModule) {
    const SystemAdminShell = loadedModule?.default;
    if (!SystemAdminShell) return renderWithLayout(html`<div className="p-20 text-center">Loading...</div>`);
    return renderWithLayout(html`<${SystemAdminShell} view=${view} navigate=${nav} user=${displayUser} activeProfile=${activeProfile} />`);
  }

  if (activeProduct === 'profiles' && loadedModule) {
    const ProfilesShell = loadedModule?.default;
    if (!ProfilesShell) return renderWithLayout(html`<div className="p-20 text-center">Loading...</div>`);
    const profileView = (view === 'cv' || view === 'cv-maker') ? 'profile/me' : view;
    return renderWithLayout(html`<${ProfilesShell} view=${profileView} navigate=${nav} user=${displayUser} onUserUpdate=${onUserUpdate} onLogout=${onLogout} />`);
  }

  if (activeProduct === 'entity-about' && loadedModule) {
    const { InstitutionAboutPage, CompanyAboutPage } = loadedModule;
    if (view?.startsWith('institution/')) {
      const institutionId = view.split('/')[1];
      return renderWithLayout(html`<${InstitutionAboutPage} institutionId=${institutionId} navigate=${nav} />`);
    }
    if (view?.startsWith('company/')) {
      const companyId = view.split('/')[1];
      return renderWithLayout(html`<${CompanyAboutPage} companyId=${companyId} navigate=${nav} />`);
    }
  }

  return renderWithLayout(html`
    <div className="p-20 text-center">
      <p className="text-[var(--app-text-secondary)]">Welcome, ${toDisplayString(displayUser?.name) || toDisplayString(displayUser?.email) || 'there'}</p>
      <p className="text-[var(--app-text-secondary)] mt-2">Select a product from the sidebar to get started.</p>
    </div>
  `);
};

export default App;
