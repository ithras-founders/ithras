/**
 * Publication home — posts list, subscribe, owner composer.
 */
import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { ArrowLeft, Mail, X } from 'lucide-react';
import {
  getPublication,
  createPost,
  subscribeToPublication,
  unsubscribeFromPublication,
  estimateReadMinutesFromLength,
} from '/shared/services/longformApi.js';
import { goLongForm } from './longformNav.js';
import LongFormRichEditor, { LongFormEditorRail } from './LongFormRichEditor.js';

const html = htm.bind(React.createElement);

const fmtDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
};

const LongFormPublicationPage = ({ user, publicationSlug }) => {
  const uid = user?.user_numerical ?? user?.id;
  const [pub, setPub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [subBusy, setSubBusy] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postSubtitle, setPostSubtitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postBusy, setPostBusy] = useState(false);
  const [publishNow, setPublishNow] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerEditor, setComposerEditor] = useState(null);

  const handleComposerEditor = useCallback((ed) => {
    setComposerEditor(ed);
  }, []);

  const closeComposer = useCallback(() => {
    setComposerOpen(false);
    setComposerEditor(null);
  }, []);

  useEffect(() => {
    if (!composerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeComposer();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [composerOpen, closeComposer]);

  const load = useCallback(async () => {
    setErr('');
    setLoading(true);
    try {
      const row = await getPublication(publicationSlug);
      setPub(row);
    } catch (e) {
      setErr(e?.message || 'Publication not found.');
      setPub(null);
    } finally {
      setLoading(false);
    }
  }, [publicationSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = pub && uid != null && Number(pub.owner_user_id) === Number(uid);

  const toggleSubscribe = async () => {
    if (!pub || subBusy || isOwner) return;
    setSubBusy(true);
    try {
      if (pub.subscribed) {
        await unsubscribeFromPublication(pub.id);
        setPub((p) => (p ? { ...p, subscribed: false, subscriber_count: Math.max(0, (p.subscriber_count || 1) - 1) } : p));
      } else {
        await subscribeToPublication(pub.id);
        setPub((p) => (p ? { ...p, subscribed: true, subscriber_count: (p.subscriber_count || 0) + 1 } : p));
      }
    } catch (e) {
      setErr(e?.message || 'Could not update subscription.');
    } finally {
      setSubBusy(false);
    }
  };

  const submitPost = async (e) => {
    e.preventDefault();
    if (!pub || !postTitle.trim() || postBusy) return;
    setPostBusy(true);
    setErr('');
    try {
      const status = publishNow ? 'published' : 'draft';
      const row = await createPost(pub.id, {
        title: postTitle.trim(),
        subtitle: postSubtitle.trim() || undefined,
        body: postBody,
        status,
      });
      setPostTitle('');
      setPostSubtitle('');
      setPostBody('');
      setComposerOpen(false);
      goLongForm(`/longform/p/${publicationSlug}/${row.slug}`);
    } catch (e2) {
      setErr(e2?.message || 'Could not save post.');
    } finally {
      setPostBusy(false);
    }
  };

  if (loading) {
    return html`<div className="max-w-3xl mx-auto px-4 pt-8 pb-20" aria-busy="true">
      <div className="h-36 rounded-2xl animate-pulse border" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-subtle)' }} />
    </div>`;
  }

  if (!pub) {
    return html`<div className="max-w-3xl mx-auto px-4 pt-8 pb-20 text-center text-sm" style=${{ color: 'var(--app-text-muted)' }}>
      ${err || 'Publication not found.'}
      <div className="mt-6">
        <button type="button" className="text-sm font-semibold ith-focus-ring" style=${{ color: 'var(--app-accent)' }} onClick=${() => goLongForm('/longform')}>Back to LongForm</button>
      </div>
    </div>`;
  }

  const posts = pub.posts || [];

  return html`
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-4 pb-20">
      <button
        type="button"
        onClick=${() => goLongForm('/longform')}
        className="inline-flex items-center gap-2 text-sm font-medium mb-8 ith-focus-ring rounded-lg px-1 py-1 -ml-1"
        style=${{ color: 'var(--app-text-muted)' }}
      >
        <${ArrowLeft} size=${18} /> Explore LongForm
      </button>

      <header className="text-center border-b pb-10 mb-10" style=${{ borderColor: 'var(--app-border-soft)' }}>
        <h1
          className="text-3xl md:text-[2.25rem] font-bold tracking-tight mb-2"
          style=${{ fontFamily: 'Georgia, "Times New Roman", serif', color: 'var(--app-text-primary)' }}
        >
          ${pub.title}
        </h1>
        ${pub.tagline ? html`<p className="text-base max-w-xl mx-auto leading-relaxed" style=${{ color: 'var(--app-text-secondary)' }}>${pub.tagline}</p>` : null}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
          <span>${pub.subscriber_count ?? 0} subscribers</span>
          <span>·</span>
          <span>${posts.filter((p) => p.status === 'published').length} published</span>
        </div>
        ${!isOwner
          ? html`<button
              type="button"
              disabled=${subBusy}
              onClick=${toggleSubscribe}
              className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold ith-focus-ring transition-opacity disabled:opacity-50"
              style=${{
                background: pub.subscribed ? 'var(--app-surface-subtle)' : 'var(--app-accent)',
                color: pub.subscribed ? 'var(--app-text-primary)' : '#fff',
                border: pub.subscribed ? '1px solid var(--app-border-soft)' : 'none',
              }}
            >
              <${Mail} size=${18} strokeWidth=${2} /> ${pub.subscribed ? 'Subscribed' : 'Subscribe'}
            </button>`
          : html`<p className="mt-4 text-xs font-medium uppercase tracking-widest" style=${{ color: 'var(--app-accent)' }}>Your publication</p>`}
      </header>

      ${err ? html`<div className="mb-6 rounded-xl border px-4 py-3 text-sm" style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}>${err}</div>` : null}

      ${isOwner
        ? html`
            <section className="mb-12 flex justify-center">
              <button
                type="button"
                onClick=${() => setComposerOpen(true)}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm ith-focus-ring transition-opacity hover:opacity-95"
                style=${{ background: 'var(--app-accent)' }}
              >
                New post
              </button>
            </section>
          `
        : null}

      ${isOwner && composerOpen
        ? html`
            <div
              className="longform-composer-overlay fixed inset-0 z-[300] flex flex-col"
              style=${{ background: '#ffffff' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="longform-composer-title"
            >
              <header
                className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 md:px-6"
                style=${{ borderColor: '#e5e7eb', background: '#ffffff' }}
              >
                <button
                  type="button"
                  onClick=${closeComposer}
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium ith-focus-ring"
                  style=${{ color: '#374151' }}
                  aria-label="Close editor"
                >
                  <${X} size=${20} strokeWidth=${2} /> Close
                </button>
                <span className="text-sm font-medium truncate" style=${{ color: '#6b7280' }} id="longform-composer-title">New story</span>
                <span className="w-[72px] shrink-0 md:w-24" aria-hidden="true" />
              </header>
              <form
                onSubmit=${submitPost}
                className="flex min-h-0 flex-1 flex-col"
                style=${{ background: '#ffffff' }}
              >
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
                  <aside
                    className="longform-composer-rail shrink-0 overflow-y-auto border-b border-gray-200 bg-gray-50/90 md:max-h-none md:w-[280px] md:shrink-0 md:border-b-0 md:border-r md:bg-white md:sticky md:top-0 md:self-start"
                    style=${{ maxHeight: 'min(42vh, 320px)' }}
                    aria-label="Formatting"
                  >
                    <${LongFormEditorRail} editor=${composerEditor} publicationId=${pub.id} />
                  </aside>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-[680px] space-y-0 px-4 py-8 pb-12 md:px-6">
                      <input
                        value=${postTitle}
                        onInput=${(e) => setPostTitle(e.target.value)}
                        required
                        placeholder="Title"
                        className="longform-composer-title w-full border-0 bg-transparent outline-none focus:ring-0 placeholder:opacity-40 px-0 py-1 mb-4"
                        style=${{ background: '#ffffff' }}
                      />
                      <label
                        className="mb-2 block text-[10px] font-bold uppercase tracking-widest"
                        style=${{ color: '#6b7280' }}
                        htmlFor="longform-composer-subtitle"
                        >Subtitle</label>
                      <div
                        className="mb-8 rounded-xl border px-4 py-3"
                        style=${{ borderColor: '#e5e7eb', background: '#f9fafb' }}
                      >
                        <input
                          id="longform-composer-subtitle"
                          value=${postSubtitle}
                          onInput=${(e) => setPostSubtitle(e.target.value)}
                          placeholder="Optional — one line under the title"
                          className="longform-composer-subtitle mb-0 w-full border-0 bg-transparent outline-none focus:ring-0 placeholder:opacity-40 px-0 py-1"
                          style=${{ background: 'transparent' }}
                        />
                      </div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest" style=${{ color: '#6b7280' }}>Story</label>
                      <div
                        className="rounded-xl border px-2 pb-4 pt-2"
                        style=${{ borderColor: '#e5e7eb', background: '#ffffff', minHeight: 'min(55vh, 520px)' }}
                      >
                        <${LongFormRichEditor}
                          publicationId=${pub.id}
                          value=${postBody}
                          onChange=${setPostBody}
                          onEditorReady=${handleComposerEditor}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <footer
                  className="shrink-0 border-t px-4 py-4 md:px-6"
                  style=${{ borderColor: '#e5e7eb', background: '#ffffff' }}
                >
                  <div className="mx-auto flex max-w-[680px] flex-wrap items-center justify-between gap-4">
                    <label className="flex cursor-pointer select-none items-center gap-2 text-sm" style=${{ color: '#4b5563' }}>
                      <input type="checkbox" checked=${publishNow} onChange=${(e) => setPublishNow(e.target.checked)} className="rounded border-gray-300" />
                      Publish immediately
                    </label>
                    <button
                      type="submit"
                      disabled=${postBusy || !postTitle.trim()}
                      className="rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ith-focus-ring transition-opacity"
                      style=${{ background: 'var(--app-accent)' }}
                    >
                      ${postBusy ? 'Saving…' : publishNow ? 'Publish' : 'Save draft'}
                    </button>
                  </div>
                </footer>
              </form>
            </div>
          `
        : null}

      <h3 className="text-xs font-bold uppercase tracking-widest mb-6" style=${{ color: 'var(--app-text-muted)' }}>Posts</h3>
      ${posts.length === 0
        ? html`<p className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>${isOwner ? 'Click New post to write your first story.' : 'No posts yet.'}</p>`
        : html`
            <ul className="space-y-0 divide-y" style=${{ borderColor: 'var(--app-border-soft)' }}>
              ${posts.map((p) => html`
                <li key=${p.id} className="py-8 first:pt-0">
                  <button
                    type="button"
                    onClick=${() => {
                      if (p.status === 'published' || isOwner) goLongForm(`/longform/p/${publicationSlug}/${p.slug}`);
                    }}
                    disabled=${p.status !== 'published' && !isOwner}
                    className="text-left w-full ith-focus-ring rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4
                        className="text-lg md:text-xl font-bold leading-snug hover:underline"
                        style=${{ fontFamily: 'Georgia, "Times New Roman", serif', color: 'var(--app-text-primary)' }}
                      >
                        ${p.title}
                      </h4>
                      ${p.status === 'draft' && isOwner
                        ? html`<span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0" style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-muted)' }}>Draft</span>`
                        : null}
                    </div>
                  </button>
                  ${p.subtitle ? html`<p className="text-[15px] leading-relaxed mt-2" style=${{ color: 'var(--app-text-secondary)' }}>${p.subtitle}</p>` : null}
                  <div className="text-sm mt-2" style=${{ color: 'var(--app-text-muted)' }}>
                    ${fmtDate(p.published_at || p.created_at)}
                    ${p.body_length ? ` · ${estimateReadMinutesFromLength(p.body_length)} min read` : ''}
                  </div>
                </li>
              `)}
            </ul>
          `}
    </div>
  `;
};

export default LongFormPublicationPage;
