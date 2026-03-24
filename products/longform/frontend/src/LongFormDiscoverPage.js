/**
 * LongForm home — discover recent posts and publications; start a publication.
 */
import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { Plus, Library } from 'lucide-react';
import {
  listRecentPosts,
  listPublications,
  createPublication,
  estimateReadMinutesFromLength,
} from '/shared/services/longformApi.js';
import { goLongForm } from './longformNav.js';

const html = htm.bind(React.createElement);

const fmtDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
};

const LongFormDiscoverPage = () => {
  const [recent, setRecent] = useState([]);
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    setLoading(true);
    try {
      const [r, p] = await Promise.all([listRecentPosts({ limit: 24 }), listPublications({ limit: 40 })]);
      setRecent(r?.items ?? []);
      setPubs(p?.items ?? []);
    } catch (e) {
      setErr(e?.message || 'Could not load LongForm.');
      setRecent([]);
      setPubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCreatePublication = async (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || creating) return;
    setCreating(true);
    setErr('');
    try {
      const row = await createPublication({ title, tagline: newTagline.trim() || undefined });
      setNewTitle('');
      setNewTagline('');
      setShowCreate(false);
      goLongForm(`/longform/p/${row.slug}`);
    } catch (e2) {
      setErr(e2?.message || 'Could not create publication.');
    } finally {
      setCreating(false);
    }
  };

  const featured = recent[0];
  const rest = recent.slice(1);

  return html`
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-2 pb-20">
      <header className="text-center border-b pb-10 mb-10 md:mb-12" style=${{ borderColor: 'var(--app-border-soft)' }}>
        <div
          className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-xl font-serif font-bold mb-4"
          style=${{ background: 'var(--app-text-primary)', color: 'var(--app-surface)' }}
        >
          L
        </div>
        <h1
          className="text-3xl md:text-[2.25rem] font-bold tracking-tight mb-2"
          style=${{ fontFamily: 'Georgia, "Times New Roman", serif', color: 'var(--app-text-primary)' }}
        >
          LongForm
        </h1>
        <p className="text-sm md:text-base max-w-lg mx-auto leading-relaxed" style=${{ color: 'var(--app-text-secondary)' }}>
          Read and write essays on Ithras—subscribe to publications you care about and star posts you want to revisit.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick=${() => setShowCreate((s) => !s)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ith-focus-ring transition-colors"
            style=${{ background: 'var(--app-accent)', color: '#fff' }}
          >
            <${Plus} size=${18} strokeWidth=${2} /> Start a publication
          </button>
        </div>
      </header>

      ${err
        ? html`<div key="lf-err" className="mb-6 rounded-xl border px-4 py-3 text-sm" style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}>${err}</div>`
        : null}

      ${showCreate
        ? html`
            <form
              key="lf-create"
              onSubmit=${onCreatePublication}
              className="mb-10 rounded-2xl border p-5 space-y-4"
              style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
            >
              <h2 className="text-sm font-bold uppercase tracking-widest" style=${{ color: 'var(--app-text-muted)' }}>New publication</h2>
              <div>
                <label className="block text-xs font-medium mb-1" style=${{ color: 'var(--app-text-muted)' }}>Title</label>
                <input
                  value=${newTitle}
                  onInput=${(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                  style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-bg)', color: 'var(--app-text-primary)' }}
                  placeholder="e.g. Placement notes"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style=${{ color: 'var(--app-text-muted)' }}>Tagline (optional)</label>
                <input
                  value=${newTagline}
                  onInput=${(e) => setNewTagline(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                  style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-bg)', color: 'var(--app-text-primary)' }}
                  placeholder="One line about what you publish"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick=${() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border"
                  style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled=${creating || !newTitle.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style=${{ background: 'var(--app-accent)' }}
                >
                  ${creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          `
        : null}

      ${loading
        ? html`<div key="lf-loading" className="space-y-4" aria-busy="true">
            <div key="lf-loading-a" className="h-40 rounded-2xl animate-pulse border" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-subtle)' }} />
            <div key="lf-loading-b" className="h-32 rounded-2xl animate-pulse border" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-subtle)' }} />
          </div>`
        : null}

      ${!loading && featured
        ? html`
            <article key="lf-featured" className="mb-12 md:mb-14 pb-10 border-b" style=${{ borderColor: 'var(--app-border-soft)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style=${{ color: 'var(--app-accent)' }}>Featured</p>
              <button
                type="button"
                onClick=${() => goLongForm(`/longform/p/${featured.publication_slug}/${featured.slug}`)}
                className="text-left w-full ith-focus-ring rounded-xl -mx-2 px-2 py-1"
              >
                <h2
                  className="text-2xl md:text-[1.75rem] font-bold leading-snug mb-3 hover:underline"
                  style=${{ fontFamily: 'Georgia, "Times New Roman", serif', color: 'var(--app-text-primary)' }}
                >
                  ${featured.title}
                </h2>
              </button>
              ${featured.subtitle
                ? html`<p key="lf-feat-sub" className="text-base leading-relaxed mb-4" style=${{ color: 'var(--app-text-secondary)' }}>${featured.subtitle}</p>`
                : featured.excerpt
                  ? html`<p key="lf-feat-ex" className="text-base leading-relaxed mb-4 line-clamp-3" style=${{ color: 'var(--app-text-secondary)' }}>${featured.excerpt}</p>`
                  : null}
              <p className="text-sm mb-0" style=${{ color: 'var(--app-text-muted)' }}>
                ${featured.publication_title} · ${fmtDate(featured.published_at || featured.created_at)} · ${estimateReadMinutesFromLength(`${featured.excerpt || ''}${featured.subtitle || ''}`.length)} min read
              </p>
            </article>
          `
        : null}

      ${!loading && !featured
        ? html`<p key="lf-empty" className="text-center text-sm mb-10" style=${{ color: 'var(--app-text-muted)' }}>No published posts yet. Start a publication and publish your first story.</p>`
        : null}

      ${!loading && rest.length > 0
        ? html`
            <section key="lf-recent">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-6" style=${{ color: 'var(--app-text-muted)' }}>Recent</h3>
            <ul className="space-y-0 divide-y mb-14" style=${{ borderColor: 'var(--app-border-soft)' }}>
              ${rest.map(
                (post) => html`
                  <li key=${`${post.publication_slug}-${post.slug}`} className="py-8 first:pt-0">
                    <button
                      type="button"
                      onClick=${() => goLongForm(`/longform/p/${post.publication_slug}/${post.slug}`)}
                      className="text-left w-full ith-focus-ring rounded-lg"
                    >
                      <h4
                        className="text-lg md:text-xl font-bold leading-snug mb-2 hover:underline"
                        style=${{ fontFamily: 'Georgia, "Times New Roman", serif', color: 'var(--app-text-primary)' }}
                      >
                        ${post.title}
                      </h4>
                    </button>
                    ${post.subtitle
                      ? html`<p key=${`lf-rs-${post.publication_slug}-${post.slug}`} className="text-[15px] leading-relaxed mb-3" style=${{ color: 'var(--app-text-secondary)' }}>${post.subtitle}</p>`
                      : null}
                    <p className="text-sm mb-0" style=${{ color: 'var(--app-text-muted)' }}>
                      ${post.publication_title} · ${fmtDate(post.published_at || post.created_at)}
                    </p>
                  </li>
                `,
              )}
            </ul>
            </section>
          `
        : null}

      ${!loading && pubs.length > 0
        ? html`
            <section key="lf-publications">
            <div className="flex items-center gap-2 mb-4">
              <${Library} size=${18} strokeWidth=${2} style=${{ color: 'var(--app-accent)' }} />
              <h3 className="text-xs font-bold uppercase tracking-widest" style=${{ color: 'var(--app-text-muted)' }}>Publications</h3>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              ${pubs.map(
                (pub) => html`
                  <li key=${pub.id}>
                    <button
                      type="button"
                      onClick=${() => goLongForm(`/longform/p/${pub.slug}`)}
                      className="w-full text-left rounded-2xl border p-4 transition-colors hover:bg-[var(--app-surface-hover)] ith-focus-ring"
                      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
                    >
                      <div className="font-semibold text-sm mb-1" style=${{ color: 'var(--app-text-primary)' }}>${pub.title}</div>
                      ${pub.tagline ? html`<div key=${`lf-pub-t-${pub.id}`} className="text-xs line-clamp-2" style=${{ color: 'var(--app-text-muted)' }}>${pub.tagline}</div>` : null}
                      <div className="text-[11px] mt-2" style=${{ color: 'var(--app-text-faint)' }}>
                        ${pub.published_post_count ?? 0} posts · ${pub.subscriber_count ?? 0} subscribers
                      </div>
                    </button>
                  </li>
                `,
              )}
            </ul>
            </section>
          `
        : null}
    </div>
  `;
};

export default LongFormDiscoverPage;
