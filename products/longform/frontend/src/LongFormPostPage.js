/**
 * Single post reader — star, subscribe, publication link.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import htm from 'htm';
import DOMPurify from 'dompurify';
import { ArrowLeft, Star, Mail } from 'lucide-react';
import {
  getPost,
  starPost,
  unstarPost,
  subscribeToPublication,
  unsubscribeFromPublication,
  estimateReadMinutesFromLength,
  bodyLooksLikeStoredHtml,
  bodyPlainTextLength,
} from '/shared/services/longformApi.js';
import { goLongForm } from './longformNav.js';

const html = htm.bind(React.createElement);

const LONGFORM_PURIFY = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    's',
    'strike',
    'del',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'hr',
    'a',
    'img',
    'sup',
    'sub',
    'span',
  ],
  ALLOWED_ATTR: ['href', 'title', 'rel', 'src', 'alt', 'width', 'height', 'style'],
  ALLOW_DATA_ATTR: false,
};

const fmtDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
};

const LongFormPostPage = ({ user, publicationSlug, postSlug }) => {
  const uid = user?.user_numerical ?? user?.id;
  const loggedIn = user != null;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [starBusy, setStarBusy] = useState(false);
  const [subBusy, setSubBusy] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    setLoading(true);
    try {
      const row = await getPost(publicationSlug, postSlug);
      setPost(row);
    } catch (e) {
      setErr(e?.message || 'Post not found.');
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [publicationSlug, postSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = post && uid != null && Number(post.owner_user_id) === Number(uid);

  const toggleStar = async () => {
    if (!post || starBusy) return;
    setStarBusy(true);
    try {
      if (post.starred) {
        await unstarPost(post.id);
        setPost((p) =>
          p
            ? {
                ...p,
                starred: false,
                star_count: Math.max(0, (p.star_count ?? 1) - 1),
              }
            : p,
        );
      } else {
        await starPost(post.id);
        setPost((p) =>
          p
            ? {
                ...p,
                starred: true,
                star_count: (p.star_count || 0) + 1,
              }
            : p,
        );
      }
    } catch (e) {
      setErr(e?.message || 'Could not update star.');
    } finally {
      setStarBusy(false);
    }
  };

  const toggleSubscribe = async () => {
    if (!post || subBusy || isOwner) return;
    setSubBusy(true);
    try {
      const pubId = post.publication_id;
      if (post.subscribed) {
        await unsubscribeFromPublication(pubId);
        setPost((p) => (p ? { ...p, subscribed: false } : p));
      } else {
        await subscribeToPublication(pubId);
        setPost((p) => (p ? { ...p, subscribed: true } : p));
      }
    } catch (e) {
      setErr(e?.message || 'Could not update subscription.');
    } finally {
      setSubBusy(false);
    }
  };

  const safeBodyHtml = useMemo(() => {
    if (!post?.body) return '';
    if (!bodyLooksLikeStoredHtml(post.body)) return '';
    return DOMPurify.sanitize(post.body, LONGFORM_PURIFY);
  }, [post]);

  const useHtmlBody = post && bodyLooksLikeStoredHtml(post.body || '');

  if (loading) {
    return html`<div className="max-w-[680px] mx-auto px-4 pt-8 pb-20" aria-busy="true">
      <div className="h-48 rounded-2xl animate-pulse border" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-subtle)' }} />
    </div>`;
  }

  if (!post) {
    return html`<div className="max-w-[680px] mx-auto px-4 pt-8 pb-20 text-center text-sm" style=${{ color: 'var(--app-text-muted)' }}>
      ${err || 'Post not found.'}
      <div className="mt-6">
        ${loggedIn
          ? html`<button
              type="button"
              className="text-sm font-semibold ith-focus-ring"
              style=${{ color: 'var(--app-accent)' }}
              onClick=${() => goLongForm('/longform')}
            >
              Back to LongForm
            </button>`
          : html`<a href="/" className="text-sm font-semibold ith-focus-ring" style=${{ color: 'var(--app-accent)' }}>Log in</a>`}
      </div>
    </div>`;
  }

  const readMin = estimateReadMinutesFromLength(bodyPlainTextLength(post.body || ''));

  const backControl = loggedIn
    ? html`
        <button
          type="button"
          onClick=${() => goLongForm(`/longform/p/${publicationSlug}`)}
          className="inline-flex items-center gap-2 text-sm font-medium mb-8 ith-focus-ring rounded-lg px-1 py-1 -ml-1"
          style=${{ color: 'var(--app-text-muted)' }}
        >
          <${ArrowLeft} size=${18} /> ${post.publication_title}
        </button>
      `
    : html`
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium mb-8 ith-focus-ring rounded-lg px-1 py-1 -ml-1"
          style=${{ color: 'var(--app-text-muted)' }}
        >
          <${ArrowLeft} size=${18} /> Log in to explore LongForm
        </a>
      `;

  return html`
    <article className="max-w-[680px] mx-auto px-4 md:px-6 pt-4 pb-24">
      ${backControl}

      ${err ? html`<div className="mb-6 rounded-xl border px-4 py-3 text-sm" style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}>${err}</div>` : null}

      <header className="mb-10">
        <h1
          className="text-3xl md:text-[2.5rem] font-bold leading-tight mb-4"
          style=${{ fontFamily: 'Georgia, "Times New Roman", serif', color: 'var(--app-text-primary)' }}
        >
          ${post.title}
        </h1>
        ${post.subtitle ? html`<p className="text-lg md:text-xl leading-relaxed mb-6" style=${{ color: 'var(--app-text-secondary)' }}>${post.subtitle}</p>` : null}
        <div className="flex flex-wrap items-center gap-3 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
          <span>${fmtDate(post.published_at || post.created_at)}</span>
          <span>·</span>
          <span>${readMin} min read</span>
          ${post.star_count != null
            ? html`<span>·</span><span>${post.star_count} ${post.star_count === 1 ? 'star' : 'stars'}</span>`
            : null}
        </div>
        ${loggedIn
          ? html`<div className="flex flex-wrap gap-2 mt-6">
              <button
                type="button"
                disabled=${starBusy}
                onClick=${toggleStar}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border ith-focus-ring transition-colors disabled:opacity-50"
                style=${{
                  borderColor: 'var(--app-border-soft)',
                  background: post.starred ? 'var(--app-accent-soft)' : 'var(--app-surface)',
                  color: post.starred ? 'var(--app-accent)' : 'var(--app-text-primary)',
                }}
              >
                <${Star} size=${18} strokeWidth=${2} fill=${post.starred ? 'currentColor' : 'none'} /> ${post.starred ? 'Starred' : 'Star'}
              </button>
              ${!isOwner
                ? html`<button
                    type="button"
                    disabled=${subBusy}
                    onClick=${toggleSubscribe}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ith-focus-ring transition-opacity disabled:opacity-50"
                    style=${{
                      background: post.subscribed ? 'var(--app-surface-subtle)' : 'var(--app-accent)',
                      color: post.subscribed ? 'var(--app-text-primary)' : '#fff',
                      border: post.subscribed ? '1px solid var(--app-border-soft)' : 'none',
                    }}
                  >
                    <${Mail} size=${18} strokeWidth=${2} /> ${post.subscribed ? 'Subscribed' : 'Subscribe'}
                  </button>`
                : null}
            </div>`
          : null}
      </header>

      ${useHtmlBody
        ? html`<div
            className="longform-body text-[17px] leading-[1.75] pb-12 border-b"
            style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-primary)' }}
            dangerouslySetInnerHTML=${{ __html: safeBodyHtml }}
          />`
        : html`<div
            className="text-[17px] leading-[1.75] whitespace-pre-wrap pb-12 border-b"
            style=${{ fontFamily: 'Georgia, "Times New Roman", serif', color: 'var(--app-text-primary)', borderColor: 'var(--app-border-soft)' }}
          >
            ${post.body || ''}
          </div>`}

      <footer className="pt-10 text-center">
        <p className="text-sm mb-4" style=${{ color: 'var(--app-text-muted)' }}>Published in</p>
        ${loggedIn
          ? html`<button
              type="button"
              onClick=${() => goLongForm(`/longform/p/${publicationSlug}`)}
              className="text-lg font-bold ith-focus-ring hover:underline"
              style=${{ fontFamily: 'Georgia, "Times New Roman", serif', color: 'var(--app-text-primary)' }}
            >
              ${post.publication_title}
            </button>`
          : html`<div>
              <p className="text-lg font-bold" style=${{ fontFamily: 'Georgia, "Times New Roman", serif', color: 'var(--app-text-primary)' }}>
                ${post.publication_title}
              </p>
              <p className="text-sm mt-3" style=${{ color: 'var(--app-text-muted)' }}>
                <a href="/" className="font-semibold ith-focus-ring" style=${{ color: 'var(--app-accent)' }}>Log in</a>
                ${' '}to open this publication and subscribe.
              </p>
            </div>`}
      </footer>
    </article>
  `;
};

export default LongFormPostPage;
