/**
 * CommunityChannelNav - Refined underline-style channel navigation.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const CommunityChannelNav = ({ channels, activeChannelId, onSelectChannel, communitySlug }) => {
  const handleAll = () => {
    onSelectChannel?.(null);
    if (communitySlug) {
      window.history.pushState(null, '', `/feed/c/${communitySlug}`);
      window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    }
  };

  const handleChannel = (ch) => {
    onSelectChannel?.(ch.id);
    if (communitySlug) {
      window.history.pushState(null, '', `/feed/c/${communitySlug}/ch/${ch.slug}`);
      window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    }
  };

  const activeChannel = channels?.find((ch) => ch.id === activeChannelId);
  const items = [
    { id: null, slug: null, name: 'All' },
    ...(channels || []),
  ];

  return html`
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-8 border-b pb-px" style=${{ borderColor: 'var(--app-border-soft)' }}>
        ${items.map((item) => {
          const isActive = item.id === null ? activeChannelId == null : activeChannelId === item.id;
          return html`
            <button
              key=${item.id ?? 'all'}
              type="button"
              onClick=${() => (item.id == null ? handleAll() : handleChannel(item))}
              className="relative pt-1 pb-4 text-sm font-medium whitespace-nowrap transition-colors shrink-0 hover:opacity-80"
              style=${{
                color: isActive ? 'var(--app-accent)' : 'var(--app-text-secondary)',
              }}
            >
              ${item.name}
              ${isActive ? html`<span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full" style=${{ background: 'var(--app-accent)' }} />` : null}
            </button>
          `;
        })}
      </div>
      ${activeChannel?.description ? html`
        <p className="text-sm leading-relaxed" style=${{ color: 'var(--app-text-muted)' }}>${activeChannel.description}</p>
      ` : null}
    </div>
  `;
};

export default CommunityChannelNav;
