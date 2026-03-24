/**
 * Right rail on community feed: editorial panels, scrollable channels, calm empty blocks.
 */
import React, { useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { Hash, TrendingUp, Sparkles } from 'lucide-react';
import { FeedRailPanel, FeedRailHeading, FeedRailEmpty, FeedRailDivider } from '/shared/components/feed/FeedRailKit.js';
import { getCommunityBySlug, requestChannel } from '../../services/feedApi.js';
import { navigateToCommunityAll, navigateToCommunityChannel } from '../../utils/communityNav.js';

const html = htm.bind(React.createElement);

const CommunityFeedRightRail = ({ communitySlug, channelSlug }) => {
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('');
  const [showChReq, setShowChReq] = useState(false);
  const [chReqName, setChReqName] = useState('');
  const [chReqDesc, setChReqDesc] = useState('');
  const [chReqBusy, setChReqBusy] = useState(false);
  const [chReqErr, setChReqErr] = useState('');

  useEffect(() => {
    if (!communitySlug) return;
    setLoading(true);
    getCommunityBySlug(communitySlug)
      .then(setCommunity)
      .catch(() => setCommunity(null))
      .finally(() => setLoading(false));
  }, [communitySlug]);

  const channels = community?.channels || [];
  const hasChannels = community?.has_channels && channels.length > 0;
  const canRequestChannel = Boolean(community?.is_member && community?.has_channels);
  const activeChannelId = useMemo(() => {
    if (!channelSlug || !channels.length) return null;
    const ch = channels.find((c) => c.slug === channelSlug);
    return ch?.id ?? null;
  }, [channelSlug, channels]);

  const q = channelFilter.trim().toLowerCase();
  const filteredChannels = q ? channels.filter((c) => (c.name || '').toLowerCase().includes(q)) : channels;

  if (!communitySlug) return null;

  if (loading) {
    return html`
      <div className="p-2.5 sm:p-3 space-y-3" aria-busy="true">
        <div className="h-32 rounded-2xl animate-pulse border" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-subtle)' }} />
        <div className="h-28 rounded-2xl animate-pulse border" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-subtle)' }} />
      </div>
    `;
  }

  if (!community) {
    return html`
      <div className="p-3 text-xs" style=${{ color: 'var(--app-text-muted)' }}>Community unavailable</div>
    `;
  }

  const channelRow = (label, isActive, onClick, titleAttr) => html`
    <button
      type="button"
      onClick=${onClick}
      title=${titleAttr || label}
      className="group w-full text-left rounded-xl px-2.5 py-2 text-[13px] leading-snug transition-all ith-focus-ring border border-transparent truncate hover:bg-[var(--app-surface-hover)]"
      style=${{
        background: isActive ? 'var(--app-accent-soft)' : 'transparent',
        color: isActive ? 'var(--app-accent)' : 'var(--app-text-primary)',
        fontWeight: isActive ? 600 : 500,
        boxShadow: isActive
          ? 'inset 0 0 0 1px var(--app-accent-soft), inset 3px 0 0 0 var(--app-accent)'
          : 'none',
      }}
    >
      ${label}
    </button>
  `;

  const channelsBlock = hasChannels
    ? html`
        <${FeedRailPanel}>
          <${FeedRailHeading}
            icon=${Hash}
            title="Channels"
            kicker="All posts together, or jump into a topic."
          />
          <${FeedRailDivider} />
          <div className="px-2.5 pb-2">
            ${channels.length > 8
              ? html`
                  <label className="sr-only" htmlFor="ithras-rail-channel-filter">Filter channels</label>
                  <input
                    id="ithras-rail-channel-filter"
                    type="search"
                    placeholder="Search channels…"
                    value=${channelFilter}
                    onInput=${(e) => setChannelFilter(e.target.value)}
                    className="mb-2 w-full rounded-[var(--radius-md)] border px-2.5 py-2 text-xs outline-none transition-shadow focus:ring-2 focus:ring-[var(--app-accent-soft)]"
                    style=${{
                      borderColor: 'var(--app-border-soft)',
                      background: 'var(--app-bg)',
                      color: 'var(--app-text-primary)',
                    }}
                  />
                `
              : null}
            <nav
              className="flex flex-col gap-1 min-h-0 max-h-[min(48vh,440px)] overflow-y-auto custom-scrollbar py-1"
              aria-label="Community channels"
            >
              ${channelRow(
                'All posts',
                activeChannelId == null,
                () => navigateToCommunityAll(communitySlug),
                'Every post in this community',
              )}
              ${filteredChannels.length === 0
                ? html`<p className="text-[11px] px-2 py-3 text-center" style=${{ color: 'var(--app-text-muted)' }}>No matches</p>`
                : filteredChannels.map((ch) =>
                    channelRow(
                      `# ${ch.name}`,
                      activeChannelId === ch.id,
                      () => navigateToCommunityChannel(communitySlug, ch.slug),
                      ch.description ? `${ch.name} — ${ch.description}` : ch.name,
                    ),
                  )}
            </nav>
            ${canRequestChannel
              ? html`
                  <div className="px-2.5 pb-2.5 pt-1 border-t" style=${{ borderColor: 'var(--app-border-soft)' }}>
                    <button
                      type="button"
                      onClick=${() => {
                        setShowChReq(true);
                        setChReqErr('');
                        setChReqName('');
                        setChReqDesc('');
                      }}
                      className="w-full mt-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ith-focus-ring border"
                      style=${{
                        borderColor: 'var(--app-border-soft)',
                        color: 'var(--app-accent)',
                        background: 'var(--app-accent-soft)',
                      }}
                    >
                      Request a channel
                    </button>
                    <p className="text-[10px] mt-1.5 px-0.5 leading-snug text-center" style=${{ color: 'var(--app-text-faint)' }}>
                      Goes to an admin for approval before it appears here.
                    </p>
                  </div>
                `
              : null}
          </div>
        </${FeedRailPanel}>
      `
    : null;

  const trendingBlock = html`
    <${FeedRailPanel}>
      <${FeedRailHeading} icon=${TrendingUp} title="Trending here" kicker="Posts picking up speed in this community." />
      <${FeedRailEmpty}
        icon=${TrendingUp}
        line="Nothing trending yet"
        hint="When members react and reply, standout threads can show up here."
      />
    </${FeedRailPanel}>
  `;

  const suggestedBlock = html`
    <${FeedRailPanel}>
      <${FeedRailHeading} icon=${Sparkles} title="Suggested" kicker="People and threads you might care about." />
      <${FeedRailEmpty}
        icon=${Sparkles}
        line="No suggestions yet"
        hint="We’ll use your activity in this space to surface relevant picks."
      />
    </${FeedRailPanel}>
  `;

  const submitChannelRequest = async (e) => {
    e.preventDefault();
    if (!community?.id) return;
    const name = chReqName.trim();
    if (!name) {
      setChReqErr('Enter a channel name.');
      return;
    }
    setChReqBusy(true);
    setChReqErr('');
    try {
      await requestChannel(community.id, { name, description: chReqDesc.trim() || undefined });
      setShowChReq(false);
      setChReqName('');
      setChReqDesc('');
    } catch (err) {
      setChReqErr(err.message || 'Could not submit request');
    } finally {
      setChReqBusy(false);
    }
  };

  return html`
    <div className="flex flex-col min-h-0 p-2.5 sm:p-3 gap-0">
      ${channelsBlock}${trendingBlock}${suggestedBlock}
      ${showChReq && community
        ? html`
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              style=${{ background: 'rgba(0,0,0,0.45)' }}
              onClick=${() => !chReqBusy && setShowChReq(false)}
            >
              <div
                className="rounded-2xl border shadow-xl max-w-md w-full p-5"
                style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
                onClick=${(e) => e.stopPropagation()}
              >
                <h3 className="text-base font-semibold mb-1" style=${{ color: 'var(--app-text-primary)' }}>Request a channel</h3>
                <p className="text-xs mb-4" style=${{ color: 'var(--app-text-muted)' }}>
                  In <span className="font-medium">${community.name}</span>. An administrator will create the channel if approved.
                </p>
                <form onSubmit=${submitChannelRequest} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style=${{ color: 'var(--app-text-secondary)' }}>Channel name *</label>
                    <input
                      value=${chReqName}
                      onInput=${(e) => setChReqName(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-bg)', color: 'var(--app-text-primary)' }}
                      placeholder="e.g. Weekly wins"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style=${{ color: 'var(--app-text-secondary)' }}>Description (optional)</label>
                    <textarea
                      value=${chReqDesc}
                      onInput=${(e) => setChReqDesc(e.target.value)}
                      rows=${2}
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-y min-h-[56px]"
                      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-bg)', color: 'var(--app-text-primary)' }}
                      placeholder="What should people post here?"
                    />
                  </div>
                  ${chReqErr ? html`<p className="text-xs" style=${{ color: 'var(--app-danger)' }}>${chReqErr}</p>` : null}
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      disabled=${chReqBusy}
                      onClick=${() => setShowChReq(false)}
                      className="px-3 py-2 rounded-xl text-sm font-medium border"
                      style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled=${chReqBusy}
                      className="px-3 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                      style=${{ background: 'var(--app-accent)' }}
                    >
                      ${chReqBusy ? 'Submitting…' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          `
        : null}
    </div>
  `;
};

export default CommunityFeedRightRail;
