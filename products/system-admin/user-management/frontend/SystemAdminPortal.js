import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getInstitutions, getCompanies, getPrograms,
  getRoles, deleteUser, deleteCompany, deleteInstitution,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';
import InstitutionDetailView from './InstitutionDetailView.js';
import CompanyDetailView from './CompanyDetailView.js';
import UserDetailView from './UserDetailView.js';
import { MigrationsPortal } from '/products/system-admin/migrations/frontend/index.js';
import { TestingPortal } from '/products/system-admin/testing/frontend/index.js';
import { DatabaseManagement } from '/products/system-admin/database/frontend/index.js';
import CommunityManagementPortal from './CommunityManagementPortal.js';
import PrepManagementPortal from './PrepManagementPortal.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { PeopleTab, InstitutionsTab, CompaniesTab, AccessControlTab } from './tabs/index.js';
import PendingApprovalsView from './PendingApprovalsView.js';

const html = htm.bind(React.createElement);

const SystemAdminPortal = ({ user, activeView, activeProfile, navigate }) => {
  const toast = useToast();
  const { confirm } = useDialog();

  const viewParts = (activeView || '').split('/').filter(Boolean);
  const baseTab = viewParts[1] || 'institutions';
  const drillType = viewParts[1];
  const drillId = viewParts[2];
  const isPendingApprovals = activeView === 'system-admin/pending-approvals';
  const isUserDetail = drillType === 'people' && viewParts[2] === 'user' && viewParts[3];
  const userId = isUserDetail ? viewParts[3] : null;
  const isDrillDown = (drillType === 'institutions' || drillType === 'companies') && drillId;
  const activeTab = isDrillDown ? drillType : baseTab;
  const [institutions, setInstitutions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [programsByInstitution, setProgramsByInstitution] = useState({});
  const [loading, setLoading] = useState(false);

  const displayUser = user || {};
  const roleStr = activeProfile?.role?.name || displayUser?.role;
  const isSystemAdmin = roleStr === UserRole.SYSTEM_ADMIN;
  const isInstitutionAdmin = roleStr === UserRole.INSTITUTION_ADMIN;
  const restrictedInstitutionId = isInstitutionAdmin ? (displayUser?.institution_id || activeProfile?.institution_id) : null;

  const fetchData = useCallback(async () => {
    try {
      const rolesData = await getRoles().catch(() => []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchInstitutionsAndPrograms = useCallback(async () => {
    try {
      const instRes = await getInstitutions({ limit: 500 }).catch(() => ({ items: [] }));
      let instList = instRes?.items ?? [];
      if (restrictedInstitutionId) {
        instList = instList.filter(i => i.id === restrictedInstitutionId);
      }
      setInstitutions(instList);
      const progMap = {};
      await Promise.all(instList.map(async (inst) => {
        try { progMap[inst.id] = await getPrograms(inst.id); } catch { progMap[inst.id] = []; }
      }));
      setProgramsByInstitution(progMap);
    } catch (err) {
      console.error('Failed to fetch institutions:', err);
    }
  }, [restrictedInstitutionId]);

  const fetchContextForDetailViews = useCallback(async () => {
    if (!isDrillDown && !isUserDetail) return;
    try {
      const [instRes, compRes] = await Promise.all([
        getInstitutions({ limit: 500 }).catch(() => ({ items: [] })),
        getCompanies({ limit: 500 }).catch(() => ({ items: [] })),
      ]);
      let instList = instRes?.items ?? [];
      if (restrictedInstitutionId) {
        instList = instList.filter(i => i.id === restrictedInstitutionId);
      }
      setInstitutions(instList);
      setCompanies(compRes?.items ?? []);
      const progMap = {};
      await Promise.all(instList.map(async (inst) => {
        try { progMap[inst.id] = await getPrograms(inst.id); } catch { progMap[inst.id] = []; }
      }));
      setProgramsByInstitution(progMap);
    } catch (err) {
      console.error('Failed to fetch context for detail views:', err);
    }
  }, [isDrillDown, isUserDetail, restrictedInstitutionId]);

  useEffect(() => {
    if (isDrillDown || isUserDetail) fetchContextForDetailViews();
  }, [isDrillDown, isUserDetail, fetchContextForDetailViews]);

  const handleDrillDown = (type, id) => {
    if (navigate) navigate(`system-admin/${type}/${id}`);
  };

  const handleDrillBack = (type) => {
    if (navigate) navigate(`system-admin/${type}`);
  };

  if (activeView === 'database') {
    return html`
      <div className="w-full px-4 md:px-6 pt-6 pb-20">
        <${DatabaseManagement} />
      </div>
    `;
  }

  if (activeView === 'system-admin/testing') {
    return html`<${TestingPortal} />`;
  }

  if (activeView === 'system-admin/migrations') {
    return html`
      <${MigrationsPortal} />
    `;
  }

  if (activeView === 'system-admin/community') {
    return html`
      <${CommunityManagementPortal}
        onBack=${() => navigate && navigate('system-admin/institutions')}
      />
    `;
  }

  if (activeView === 'system-admin/prep-management') {
    return html`
      <${PrepManagementPortal}
        onBack=${() => navigate && navigate('system-admin/institutions')}
        navigate=${navigate}
      />
    `;
  }

  if (isPendingApprovals) {
    return html`
      <div className="w-full px-4 md:px-6 pt-6 pb-20">
        <${PendingApprovalsView}
          onBack=${() => navigate && navigate('system-admin/institutions')}
          navigate=${navigate}
        />
      </div>
    `;
  }

  if (isDrillDown && drillType === 'institutions') {
    return html`
      <div className="w-full px-4 md:px-6 pt-6 pb-20">
        <${InstitutionDetailView}
          institutionId=${drillId}
          institutions=${institutions}
          companies=${companies}
          programsByInstitution=${programsByInstitution}
          isSystemAdmin=${isSystemAdmin}
          onBack=${() => handleDrillBack('institutions')}
          navigate=${navigate}
        />
      </div>
    `;
  }

  if (isDrillDown && drillType === 'companies') {
    return html`
      <div className="w-full px-4 md:px-6 pt-6 pb-20">
        <${CompanyDetailView}
          companyId=${drillId}
          institutions=${institutions}
          companies=${companies}
          programsByInstitution=${programsByInstitution}
          isSystemAdmin=${isSystemAdmin}
          onBack=${() => handleDrillBack('companies')}
          navigate=${navigate}
        />
      </div>
    `;
  }

  if (isUserDetail && userId) {
    return html`
      <div className="w-full px-4 md:px-6 pt-6 pb-20">
        <${UserDetailView}
          userId=${userId}
          institutions=${institutions}
          companies=${companies}
          programsByInstitution=${programsByInstitution}
          roles=${roles}
          onBack=${() => navigate('system-admin/people')}
          onRefresh=${fetchData}
          deleteUser=${deleteUser}
        />
      </div>
    `;
  }

  return html`
    <div className="w-full px-4 md:px-6 pt-6 pb-20 space-y-6" data-tour-id="admin-header">
      ${activeTab === 'people' ? html`
        <${PeopleTab}
          institutions=${institutions}
          companies=${companies}
          roles=${roles}
          programsByInstitution=${programsByInstitution}
          user=${displayUser}
          toast=${toast}
          confirm=${confirm}
          onRefresh=${fetchData}
          navigate=${navigate}
          isSystemAdmin=${isSystemAdmin}
          defaultInstitutionFilter=${restrictedInstitutionId}
        />
      ` : activeTab === 'institutions' ? html`
        <${InstitutionsTab}
          isSystemAdmin=${isSystemAdmin}
          onDrillDown=${handleDrillDown}
          deleteInstitution=${deleteInstitution}
          toast=${toast}
          confirm=${confirm}
          defaultInstitutionFilter=${restrictedInstitutionId}
        />
      ` : activeTab === 'companies' ? html`
        <${CompaniesTab}
          isSystemAdmin=${isSystemAdmin}
          onDrillDown=${handleDrillDown}
          deleteCompany=${deleteCompany}
          toast=${toast}
          confirm=${confirm}
        />
      ` : html`
        <${AccessControlTab} toast=${toast} />
      `}
    </div>
  `;
};

export default SystemAdminPortal;
