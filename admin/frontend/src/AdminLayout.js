import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { AppShell } from '/shared/components/appShell/index.js';
import { Building2, Briefcase, Users, MessageCircle, Activity, BarChart3, User, FileText, Shield, Layers, Network, History, Cpu, AlertTriangle, Search, Flag, Download } from 'lucide-react';

const html = htm.bind(React.createElement);

const TECHNOLOGY_NAV = [
  { key: 'overview', label: 'Overview', href: '/admin/technology/overview', icon: Activity },
  { key: 'api', label: 'API Telemetry', href: '/admin/technology/api', icon: BarChart3 },
  { key: 'user-activity', label: 'User Activity', href: '/admin/technology/user-activity', icon: User },
  { key: 'audit', label: 'Audit Logs', href: '/admin/technology/audit', icon: FileText },
  { key: 'security', label: 'Authentication & Security', href: '/admin/technology/security', icon: Shield },
  { key: 'social', label: 'Communities / Feed / Messaging', href: '/admin/technology/social', icon: Layers },
  { key: 'network', label: 'Network Telemetry', href: '/admin/technology/network', icon: Network },
  { key: 'entity-history', label: 'Entity Change History', href: '/admin/technology/entity-history', icon: History },
  { key: 'jobs', label: 'Jobs / Integrations / Webhooks', href: '/admin/technology/jobs', icon: Cpu },
  { key: 'errors', label: 'Errors / Failures', href: '/admin/technology/errors', icon: AlertTriangle },
  { key: 'search', label: 'Search & Discovery', href: '/admin/technology/search', icon: Search },
  { key: 'moderation', label: 'Moderation', href: '/admin/technology/moderation', icon: Flag },
  { key: 'compliance', label: 'Data Export / Compliance', href: '/admin/technology/compliance', icon: Download },
];

const ENTITIES_NAV = [
  { key: 'institutions', label: 'Institution Management', href: '/admin/institutions', icon: Building2 },
  { key: 'organisations', label: 'Organisation Management', href: '/admin/organisations', icon: Briefcase },
];

const USERS_NAV = [
  { key: 'users', label: 'User Management', href: '/admin/users', icon: Users },
];

const COMMUNITIES_NAV = [
  { key: 'communities', label: 'Communities', href: '/admin/communities', icon: MessageCircle },
  { key: 'requests', label: 'Community Requests', href: '/admin/community-requests', icon: MessageCircle },
];

function getAdminNavItems(path) {
  if (path.includes('/admin/technology')) return TECHNOLOGY_NAV;
  if (path.includes('/admin/users')) return USERS_NAV;
  if (path.includes('/admin/community-requests') || path.includes('/admin/communities')) return COMMUNITIES_NAV;
  if (path.includes('/admin/institutions') || path.includes('/admin/organisations')) return ENTITIES_NAV;
  return ENTITIES_NAV;
}

function getAdminActiveTab(path) {
  if (path.includes('/admin/technology')) {
    const match = path.match(/\/admin\/technology\/([^/]+)/);
    return match ? match[1] : 'overview';
  }
  if (path.includes('/admin/users')) return 'users';
  if (path.includes('/admin/community-requests')) return 'requests';
  if (path.includes('/admin/communities')) return 'communities';
  if (path.includes('/admin/organisations')) return 'organisations';
  if (path.includes('/admin/institutions')) return 'institutions';
  return '';
}

/**
 * Admin layout wrapping all admin pages.
 * Top bar has Users/Entities/Communities; left sidebar shows contextual sub-nav.
 */
const AdminLayout = ({ children, activeTab, user, onLogout }) => {
  const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/admin');
  useEffect(() => {
    const handler = () => setPath(window.location.pathname || '/admin');
    window.addEventListener('popstate', handler);
    window.addEventListener('ithras:path-changed', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('ithras:path-changed', handler);
    };
  }, []);

  const navItems = getAdminNavItems(path);
  const resolvedActiveTab = getAdminActiveTab(path);

  return html`
    <${AppShell}
      activeTab=${resolvedActiveTab}
      user=${user}
      onLogout=${onLogout}
      navItems=${navItems}
      showSettings=${true}
      topBarVariant=${'admin'}
    >
      ${children}
    </${AppShell}>
  `;
};

export default AdminLayout;
