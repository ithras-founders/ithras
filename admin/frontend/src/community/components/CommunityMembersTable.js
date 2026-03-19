/**
 * Community members table - user, role, joined, activity. Actions: Promote, Remove, Ban.
 */
import React from 'react';
import htm from 'htm';
import EmptyState from './EmptyState.js';

const html = htm.bind(React.createElement);

const CommunityMembersTable = ({
  members = [],
  onPromote,
  onRemove,
  onBan,
}) => {
  if (!members.length) {
    return html`
      <${EmptyState}
        heading="No members have joined yet"
        description="Members will appear here once they join the community."
      />
    `;
  }
  return html`
    <div className="overflow-x-auto rounded-xl border" style=${{ borderColor: 'var(--app-border-soft)' }}>
      <table className="w-full text-sm">
        <thead style=${{ background: 'var(--app-surface-subtle)' }}>
          <tr>
            <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>User</th>
            <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Role</th>
            <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Joined</th>
            <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Activity</th>
            <th className="text-right px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${members.map((m) => html`
            <tr key=${m.userId} className="border-t" style=${{ borderColor: 'var(--app-border-soft)' }}>
              <td className="px-4 py-3 font-medium" style=${{ color: 'var(--app-text-primary)' }}>${m.fullName || `User ${m.userId}`}</td>
              <td className="px-4 py-3">
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium ${m.role === 'admin' ? 'bg-purple-100 text-purple-800' : m.role === 'moderator' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}">
                  ${m.role || 'member'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs" style=${{ color: 'var(--app-text-muted)' }}>${m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}</td>
              <td className="px-4 py-3" style=${{ color: 'var(--app-text-secondary)' }}>${m.activityLevel || 'low'} (${m.postCount ?? 0} posts)</td>
              <td className="px-4 py-3 text-right">
                <div className="flex gap-1 justify-end">
                  ${onPromote && m.role !== 'admin' ? html`
                    <button onClick=${() => onPromote(m)} className="px-2 py-1 rounded text-xs font-medium hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-accent)' }}>
                      ${m.role === 'moderator' ? 'Make Admin' : 'Promote'}
                    </button>
                  ` : null}
                  ${onRemove ? html`<button onClick=${() => onRemove(m)} className="px-2 py-1 rounded text-xs font-medium hover:bg-amber-50" style=${{ color: 'var(--app-text-secondary)' }}>Remove</button>` : null}
                  ${onBan ? html`<button onClick=${() => onBan(m)} className="px-2 py-1 rounded text-xs font-medium hover:bg-red-50" style=${{ color: 'var(--app-danger)' }}>Ban</button>` : null}
                </div>
              </td>
            </tr>
          `)}
        </tbody>
      </table>
    </div>
  `;
};

export default CommunityMembersTable;
