/**
 * DiscoverPage - Discover and join communities; request a new community (admin approval).
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { listCommunities, joinCommunity, requestCommunity } from '../services/feedApi.js';
import DiscoverCommunityCard from '../components/DiscoverCommunityCard.js';
import FeedFilterBar from '../components/FeedFilterBar.js';
import EmptyState from '../components/EmptyState.js';

const html = htm.bind(React.createElement);

const DiscoverPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({});
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqDescription, setReqDescription] = useState('');
  const [reqPurpose, setReqPurpose] = useState('');
  const [reqCategory, setReqCategory] = useState('');
  const [reqRulesText, setReqRulesText] = useState('');
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqMessage, setReqMessage] = useState('');

  const refresh = () => {
    setLoading(true);
    listCommunities({ type: filter.type, search: filter.search, limit: 50 })
      .then((r) => setItems(r.items || []))
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [filter.type, filter.search]);

  const handleJoin = async (communityId) => {
    try {
      await joinCommunity(communityId);
      refresh();
    } catch (_) {}
  };

  const openRequestModal = () => {
    setShowRequestModal(true);
    setReqMessage('');
    setReqName('');
    setReqDescription('');
    setReqPurpose('');
    setReqCategory('');
    setReqRulesText('');
  };

  const submitCommunityRequest = async (e) => {
    e.preventDefault();
    const name = reqName.trim();
    if (!name) {
      setReqMessage('Please enter a community name.');
      return;
    }
    setReqSubmitting(true);
    setReqMessage('');
    try {
      const rules = reqRulesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      await requestCommunity({
        name,
        description: reqDescription.trim() || undefined,
        purpose: reqPurpose.trim() || undefined,
        category: reqCategory.trim() || undefined,
        rules: rules.length ? rules : undefined,
      });
      setShowRequestModal(false);
      setReqMessage('');
    } catch (err) {
      setReqMessage(err.message || 'Could not submit request');
    } finally {
      setReqSubmitting(false);
    }
  };

  if (error) {
    return html`
      <div className="p-8">
        <div className="p-4 rounded-xl text-sm" style=${{ background: 'var(--app-danger-soft)', color: 'var(--app-danger)' }}>${error}</div>
      </div>
    `;
  }

  return html`
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Discover communities</h1>
        <p className="text-sm mt-1.5" style=${{ color: 'var(--app-text-muted)' }}>
          Browse and join new spaces—different from Home, which only shows communities you already follow.
        </p>
      </div>
      <${FeedFilterBar} filter=${filter} onFilterChange=${setFilter} />
      ${loading ? html`
        <div className="py-12 text-center text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div>
      ` : items.length === 0 ? html`
        <${EmptyState}
          title="No communities match your search"
          description="Try adjusting your filters or search."
        />
      ` : html`
        <div className="grid gap-4 sm:grid-cols-1">
          ${items.map((c) => html`
            <${DiscoverCommunityCard} key=${c.id} community=${c} onJoin=${() => handleJoin(c.id)} />
          `)}
        </div>
      `}

      <section
        className="rounded-2xl border p-5"
        style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
        aria-labelledby="discover-request-heading"
      >
        <h2 id="discover-request-heading" className="text-sm font-semibold" style=${{ color: 'var(--app-text-primary)' }}>
          Start a new community
        </h2>
        <p className="text-sm mt-1.5 mb-4" style=${{ color: 'var(--app-text-muted)' }}>
          Propose a public community for the network. An admin reviews your request before it goes live.
        </p>
        <button
          type="button"
          onClick=${openRequestModal}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 ith-focus-ring"
          style=${{ background: 'var(--app-accent)' }}
        >
          Request a community
        </button>
      </section>

      ${showRequestModal
        ? html`
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style=${{ background: 'rgba(0,0,0,0.45)' }}
              onClick=${() => !reqSubmitting && setShowRequestModal(false)}
            >
              <div
                className="rounded-2xl border shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
                style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
                onClick=${(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-1" style=${{ color: 'var(--app-text-primary)' }}>Request a community</h3>
                <p className="text-xs mb-4" style=${{ color: 'var(--app-text-muted)' }}>
                  Submissions are reviewed by an administrator. You will not get a separate email from this demo flow—check
                  back on Discover after approval.
                </p>
                <form onSubmit=${submitCommunityRequest} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style=${{ color: 'var(--app-text-secondary)' }}>Name *</label>
                    <input
                      required
                      value=${reqName}
                      onInput=${(e) => setReqName(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-bg)', color: 'var(--app-text-primary)' }}
                      placeholder="e.g. Climate policy readers"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style=${{ color: 'var(--app-text-secondary)' }}>Description</label>
                    <textarea
                      value=${reqDescription}
                      onInput=${(e) => setReqDescription(e.target.value)}
                      rows=${3}
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-y min-h-[72px]"
                      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-bg)', color: 'var(--app-text-primary)' }}
                      placeholder="What is this space about?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style=${{ color: 'var(--app-text-secondary)' }}>Purpose / audience</label>
                    <input
                      value=${reqPurpose}
                      onInput=${(e) => setReqPurpose(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-bg)', color: 'var(--app-text-primary)' }}
                      placeholder="Who should join and why?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style=${{ color: 'var(--app-text-secondary)' }}>Category (optional)</label>
                    <input
                      value=${reqCategory}
                      onInput=${(e) => setReqCategory(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-bg)', color: 'var(--app-text-primary)' }}
                      placeholder="e.g. Professional, Hobby"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style=${{ color: 'var(--app-text-secondary)' }}>Community rules (optional)</label>
                    <textarea
                      value=${reqRulesText}
                      onInput=${(e) => setReqRulesText(e.target.value)}
                      rows=${3}
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-y min-h-[72px]"
                      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-bg)', color: 'var(--app-text-primary)' }}
                      placeholder="One rule per line"
                    />
                  </div>
                  ${reqMessage
                    ? html`<p className="text-sm" style=${{ color: 'var(--app-danger)' }}>${reqMessage}</p>`
                    : null}
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      disabled=${reqSubmitting}
                      onClick=${() => setShowRequestModal(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium border"
                      style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled=${reqSubmitting}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                      style=${{ background: 'var(--app-accent)' }}
                    >
                      ${reqSubmitting ? 'Submitting…' : 'Submit for review'}
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

export default DiscoverPage;
