/**
 * Channel management table - name, description, post count, member participation, actions.
 */
import React from 'react';
import htm from 'htm';
import EmptyState from './EmptyState.js';

const html = htm.bind(React.createElement);

const ChannelManagementTable = ({
  channels = [],
  onAdd,
  onEdit,
  onDelete,
}) => {
  if (!channels.length) {
    return html`
      <${EmptyState}
        heading="No channels exist in this community"
        description="Add channels to organize discussions by topic."
        action=${onAdd ? html`
          <button
            onClick=${onAdd}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style=${{ background: 'var(--app-accent)' }}
          >
            Add Channel
          </button>
        ` : null}
      />
    `;
  }
  return html`
    <div className="space-y-4">
      ${onAdd ? html`
        <button
          onClick=${onAdd}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style=${{ background: 'var(--app-accent)' }}
        >
          Add Channel
        </button>
      ` : null}
      <div className="overflow-x-auto rounded-xl border" style=${{ borderColor: 'var(--app-border-soft)' }}>
        <table className="w-full text-sm">
          <thead style=${{ background: 'var(--app-surface-subtle)' }}>
            <tr>
              <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Name</th>
              <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Description</th>
              <th className="text-right px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Posts</th>
              <th className="text-right px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Participation</th>
              <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Created</th>
              <th className="text-right px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${channels.map((ch) => {
              const isGeneral = (ch.slug || (ch.name || '').toLowerCase()) === 'general';
              return html`
              <tr key=${ch.id} className="border-t" style=${{ borderColor: 'var(--app-border-soft)' }}>
                <td className="px-4 py-3 font-medium" style=${{ color: 'var(--app-text-primary)' }}>${ch.name}${isGeneral ? html`<span className="ml-1 text-xs" style=${{ color: 'var(--app-text-muted)' }}>(required)</span>` : ''}</td>
                <td className="px-4 py-3 max-w-[240px] truncate" style=${{ color: 'var(--app-text-secondary)' }}>${ch.description || '—'}</td>
                <td className="px-4 py-3 text-right" style=${{ color: 'var(--app-text-secondary)' }}>${ch.post_count ?? 0}</td>
                <td className="px-4 py-3 text-right" style=${{ color: 'var(--app-text-secondary)' }}>${ch.member_participation ?? 0}</td>
                <td className="px-4 py-3 text-xs" style=${{ color: 'var(--app-text-muted)' }}>${ch.created_at ? new Date(ch.created_at).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1 justify-end">
                    ${onEdit ? html`<button onClick=${() => onEdit(ch)} className="px-2 py-1 rounded text-xs font-medium hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-accent)' }}>Edit</button>` : null}
                    ${onDelete && !isGeneral ? html`<button onClick=${() => onDelete(ch)} className="px-2 py-1 rounded text-xs font-medium hover:bg-red-50" style=${{ color: 'var(--app-danger)' }}>Delete</button>` : null}
                  </div>
                </td>
              </tr>
            `})}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

export default ChannelManagementTable;
