/**
 * ChannelTabs - Channel navigation within a community.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const ChannelTabs = ({ channels, activeChannelId, onSelectChannel, communitySlug }) => {
  const handleAll = () => {
    onSelectChannel(null);
    if (communitySlug) {
      window.history.pushState(null, '', `/feed/c/${communitySlug}`);
      window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    }
  };

  const handleChannel = (ch) => {
    onSelectChannel(ch.id);
    if (communitySlug) {
      window.history.pushState(null, '', `/feed/c/${communitySlug}/ch/${ch.slug}`);
      window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    }
  };

  return html`
    <div className="flex gap-1 overflow-x-auto pb-2 border-b" style=${{ borderColor: 'var(--app-border-soft)' }}>
      <button
        type="button"
        onClick=${handleAll}
        className="px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors"
        style=${{
          background: activeChannelId == null ? 'var(--app-accent-soft)' : 'transparent',
          color: activeChannelId == null ? 'var(--app-accent)' : 'var(--app-text-secondary)',
        }}
      >
        All
      </button>
      ${(channels || []).map((ch) => html`
        <button
          key=${ch.id}
          type="button"
          onClick=${() => handleChannel(ch)}
          className="px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors"
          style=${{
            background: activeChannelId === ch.id ? 'var(--app-accent-soft)' : 'transparent',
            color: activeChannelId === ch.id ? 'var(--app-accent)' : 'var(--app-text-secondary)',
          }}
        >
          ${ch.name}
        </button>
      `)}
    </div>
  `;
};

export default ChannelTabs;
