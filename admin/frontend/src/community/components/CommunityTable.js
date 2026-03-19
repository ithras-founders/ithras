/**
 * Community list table with actions.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const CommunityTable = ({ communities, onView, onEdit, onManageChannels, onModerate, onArchive, onDelete }) => html`
  <div className="overflow-x-auto rounded-xl border" style=${{ borderColor: 'var(--app-border-soft)' }}>
    <table className="w-full text-sm">
      <thead style=${{ background: 'var(--app-surface-subtle)' }}>
        <tr>
          <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Name</th>
          <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Type</th>
          <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Parent entity</th>
          <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Channels</th>
          <th className="text-right px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Members</th>
          <th className="text-right px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Posts</th>
          <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Status</th>
          <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Created</th>
          <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Last activity</th>
          <th className="text-right px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${(communities || []).map((c) => html`
          <tr key=${c.id} className="border-t" style=${{ borderColor: 'var(--app-border-soft)' }}>
            <td className="px-4 py-3 font-medium" style=${{ color: 'var(--app-text-primary)' }}>${c.name}</td>
            <td className="px-4 py-3" style=${{ color: 'var(--app-text-secondary)' }}>${(c.type || '').charAt(0).toUpperCase() + (c.type || '').slice(1)}</td>
            <td className="px-4 py-3" style=${{ color: 'var(--app-text-secondary)' }}>${c.parent_entity_name || '—'}</td>
            <td className="px-4 py-3" style=${{ color: 'var(--app-text-secondary)' }}>${c.has_channels ? 'Yes' : 'No'}</td>
            <td className="px-4 py-3 text-right" style=${{ color: 'var(--app-text-secondary)' }}>${c.member_count ?? 0}</td>
            <td className="px-4 py-3 text-right" style=${{ color: 'var(--app-text-secondary)' }}>${c.post_count ?? 0}</td>
            <td className="px-4 py-3">
              <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium ${c.status === 'archived' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}">
                ${c.status || 'listed'}
              </span>
            </td>
            <td className="px-4 py-3 text-xs" style=${{ color: 'var(--app-text-muted)' }}>${c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
            <td className="px-4 py-3 text-xs" style=${{ color: 'var(--app-text-muted)' }}>${c.last_activity ? new Date(c.last_activity).toLocaleDateString() : '—'}</td>
            <td className="px-4 py-3 text-right">
              <div className="flex gap-1 justify-end">
                <button onClick=${() => onView?.(c)} className="px-2 py-1 rounded text-xs font-medium hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-accent)' }}>View</button>
                <button onClick=${() => onEdit?.(c)} className="px-2 py-1 rounded text-xs font-medium hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-text-secondary)' }}>Edit</button>
                ${c.has_channels ? html`<button onClick=${() => onManageChannels?.(c)} className="px-2 py-1 rounded text-xs font-medium hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-text-secondary)' }}>Channels</button>` : null}
                <button onClick=${() => onModerate?.(c)} className="px-2 py-1 rounded text-xs font-medium hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-text-secondary)' }}>Moderate</button>
                ${c.status !== 'archived' ? html`<button onClick=${() => onArchive?.(c)} className="px-2 py-1 rounded text-xs font-medium hover:bg-amber-100 text-amber-700">Archive</button>` : null}
                <button onClick=${() => onDelete?.(c)} className="px-2 py-1 rounded text-xs font-medium hover:bg-red-50" style=${{ color: 'var(--app-danger)' }}>Delete</button>
              </div>
            </td>
          </tr>
        `)}
      </tbody>
    </table>
  </div>
`;

export default CommunityTable;
