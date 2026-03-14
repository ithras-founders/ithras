import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getUsers,
  createFeedPost,
  getFeedPosts,
  likeFeedPost,
  addFeedComment,
  getFeedComments,
  recordFeedPostView,
  uploadFeedImage,
} from '/core/frontend/src/modules/shared/services/api.js';
import ProfileCard from '/core/frontend/src/modules/shared/components/ProfileCard.js';
import EmptyState from '/core/frontend/src/modules/shared/components/EmptyState.js';
import MyNetworkPage from './MyNetworkPage.js';
import MessagesInboxView from './MessagesInboxView.js';

const html = htm.bind(React.createElement);

const NoPostsIcon = () => html`
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8h10M7 12h4m5 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
`;

const formatTimeAgo = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const s = Math.floor((now - d) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString();
};

const HeartIcon = ({ filled, className = 'w-5 h-5' }) => html`
  <svg className=${className} fill=${filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth=${filled ? 0 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
`;

const CommentIcon = ({ className = 'w-5 h-5' }) => html`
  <svg className=${className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
`;

const EyeIcon = ({ className = 'w-5 h-5' }) => html`
  <svg className=${className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
`;

const ImageIcon = ({ className = 'w-5 h-5' }) => html`
  <svg className=${className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
`;

const PostComposer = ({ user, onPost }) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target?.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const res = await uploadFeedImage(file);
        if (res?.url) urls.push(res.url);
      }
      setImages((prev) => [...prev, ...urls]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePost = async () => {
    if ((!text || !text.trim()) && images.length === 0) return;
    setPosting(true);
    try {
      await createFeedPost(text.trim(), images);
      setText('');
      setImages([]);
      onPost?.();
    } catch (err) {
      console.error('Post failed:', err);
    } finally {
      setPosting(false);
    }
  };

  return html`
    <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-6 shadow-[var(--app-shadow-card)] transition-shadow duration-200 hover:shadow-[var(--app-shadow-floating)]">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--app-accent-soft)] to-[var(--app-accent)]/10 flex items-center justify-center text-[var(--app-accent)] font-semibold flex-shrink-0 overflow-hidden ring-2 ring-[var(--app-border-soft)]">
          ${user?.profile_photo_url
            ? html`<img src=${user.profile_photo_url} alt="" className="w-full h-full object-cover" />`
            : html`<span>${(user?.name || user?.email || '?').charAt(0).toUpperCase()}</span>`}
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            placeholder="Share a thought, update, or milestone..."
            value=${text}
            onChange=${(e) => setText(e.target.value)}
            className="w-full min-h-[88px] p-4 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-muted)]/50 text-[var(--app-text-primary)] placeholder-[var(--app-text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/40 focus:border-[var(--app-accent)]/30 transition-all duration-200"
            rows=${3}
          />
          ${images.length > 0
            ? html`
                <div className="mt-3 flex flex-wrap gap-2">
                  ${images.map((url, i) => html`
                    <div key=${i} className="relative group">
                      <img src=${url} alt="" className="w-24 h-24 object-cover rounded-xl border border-[var(--app-border-soft)]" />
                      <button
                        type="button"
                        onClick=${() => removeImage(i)}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--app-danger)] text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  `)}
                </div>
              `
            : null}
          <div className="mt-4 flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 text-[var(--app-text-muted)] hover:text-[var(--app-accent)] text-sm font-medium transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange=${handleImageSelect}
                disabled=${uploading}
                className="hidden"
              />
              <span className="flex items-center gap-1.5">${ImageIcon({ className: 'w-4 h-4' })} ${uploading ? 'Uploading...' : 'Add photos'}</span>
            </label>
            <button
              onClick=${handlePost}
              disabled=${posting || ((!text || !text.trim()) && images.length === 0)}
              className="ml-auto px-5 py-2.5 rounded-xl bg-[var(--app-accent)] text-white font-semibold text-sm hover:bg-[var(--app-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              ${posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};

const PostCard = ({ post, user, onLike, onComment, isRecruiter }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await getFeedComments(post.id);
      setComments(res?.items || []);
    } catch (_) {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [post.id]);

  useEffect(() => {
    if (showComments) loadComments();
  }, [showComments, loadComments]);

  useEffect(() => {
    if (user && isRecruiter) recordFeedPostView(post.id).catch(() => {});
  }, [post.id, user?.id, isRecruiter]);

  const handleLike = async () => {
    if (!user) return;
    try {
      await likeFeedPost(post.id);
      onLike?.();
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await addFeedComment(post.id, commentText.trim());
      setCommentText('');
      loadComments();
      onComment?.();
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const authorPhoto = post.author_photo_url || null;
  const authorInitial = (post.author_name || '?').charAt(0).toUpperCase();
  const imgUrls = post.image_urls || [];

  return html`
    <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-6 shadow-[var(--app-shadow-subtle)] transition-all duration-200 hover:shadow-[var(--app-shadow-card)] hover:border-[var(--app-border-strong)]">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--app-accent-soft)] to-[var(--app-accent)]/10 flex items-center justify-center text-[var(--app-accent)] font-semibold flex-shrink-0 overflow-hidden ring-2 ring-[var(--app-border-soft)]">
          ${authorPhoto
            ? html`<img src=${authorPhoto} alt="" className="w-full h-full object-cover" />`
            : html`<span>${authorInitial}</span>`}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--app-text-primary)]">${post.author_name || 'Unknown'}</span>
            ${post.author_recently_active ? html`<span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] font-semibold uppercase tracking-wide">Recently active</span>` : null}
            <span className="text-sm text-[var(--app-text-muted)]">· ${formatTimeAgo(post.created_at)}</span>
          </div>
          ${post.text ? html`<p className="mt-3 text-[var(--app-text-primary)] whitespace-pre-wrap leading-relaxed">${post.text}</p>` : null}
          ${imgUrls.length > 0
            ? (() => {
                const cols = imgUrls.length === 1 ? '1fr' : imgUrls.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr';
                const gridStyle = { gridTemplateColumns: cols };
                const imgs = imgUrls.map((url, i) => html`<img key=${i} src=${url} alt="" className="w-full rounded-xl object-cover max-h-72 border border-[var(--app-border-soft)]" />`);
                return html`<div className="mt-4 grid gap-2" style=${gridStyle}>${imgs}</div>`;
              })()
            : null}
          <div className="mt-5 flex items-center gap-5 text-sm">
            <button
              onClick=${handleLike}
              disabled=${!user}
              className="flex items-center gap-2 text-[var(--app-text-muted)] hover:text-[var(--app-accent)] disabled:opacity-50 transition-colors ${post.liked ? 'text-[var(--app-accent)]' : ''}"
            >
              ${HeartIcon({ filled: !!post.liked, className: 'w-5 h-5' })}
              <span>${post.like_count ?? 0}</span>
            </button>
            <button
              onClick=${() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-[var(--app-text-muted)] hover:text-[var(--app-accent)] transition-colors ${showComments ? 'text-[var(--app-accent)]' : ''}"
            >
              ${CommentIcon({ className: 'w-5 h-5' })}
              <span>${post.comment_count ?? 0}</span>
            </button>
            ${isRecruiter && (post.view_count ?? 0) > 0
              ? html`<span className="flex items-center gap-2 text-[var(--app-text-muted)]">${EyeIcon({ className: 'w-5 h-5' })} ${post.view_count}</span>`
              : null}
          </div>
          ${showComments
            ? html`
                <div className="mt-5 pt-5 border-t border-[var(--app-border-soft)] animate-in">
                  ${user
                    ? html`
                        <div className="flex gap-2 mb-4">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value=${commentText}
                            onChange=${(e) => setCommentText(e.target.value)}
                            onKeyDown=${(e) => e.key === 'Enter' && handleSubmitComment()}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-muted)]/50 text-[var(--app-text-primary)] placeholder-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/40 focus:border-[var(--app-accent)]/30"
                          />
                          <button
                            onClick=${handleSubmitComment}
                            disabled=${!commentText.trim() || submittingComment}
                            className="px-4 py-2.5 rounded-xl bg-[var(--app-accent)] text-white font-medium text-sm disabled:opacity-50 transition-opacity"
                          >
                            ${submittingComment ? '...' : 'Post'}
                          </button>
                        </div>
                      `
                    : null}
                  ${loadingComments
                    ? html`<div className="space-y-3"><div className="h-4 bg-[var(--app-surface-muted)] rounded animate-pulse w-3/4" /><div className="h-4 bg-[var(--app-surface-muted)] rounded animate-pulse w-1/2" /></div>`
                    : html`
                        <div className="space-y-3">
                          ${comments.map((c) => html`
                            <div key=${c.id} className="flex flex-wrap gap-2 text-sm items-baseline">
                              <span className="font-semibold text-[var(--app-text-primary)]">${c.author_name || 'User'}</span>
                              <span className="text-[var(--app-text-secondary)]">${c.text}</span>
                              <span className="text-xs text-[var(--app-text-muted)]">${formatTimeAgo(c.created_at)}</span>
                            </div>
                          `)}
                          ${comments.length === 0 ? html`<p className="text-sm text-[var(--app-text-muted)] italic">No comments yet</p>` : null}
                        </div>
                      `
                    }
                </div>
              `
            : null}
        </div>
      </div>
    </div>
  `;
};

const PostSkeleton = () => html`
  <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-6 shadow-[var(--app-shadow-subtle)]">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-[var(--app-surface-muted)] animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="h-4 bg-[var(--app-surface-muted)] rounded animate-pulse w-32" />
        <div className="h-3 bg-[var(--app-surface-muted)] rounded animate-pulse w-24" />
        <div className="space-y-2 mt-4">
          <div className="h-3 bg-[var(--app-surface-muted)] rounded animate-pulse w-full" />
          <div className="h-3 bg-[var(--app-surface-muted)] rounded animate-pulse w-5/6" />
          <div className="h-3 bg-[var(--app-surface-muted)] rounded animate-pulse w-4/6" />
        </div>
        <div className="flex gap-4 mt-6">
          <div className="h-4 w-12 bg-[var(--app-surface-muted)] rounded animate-pulse" />
          <div className="h-4 w-12 bg-[var(--app-surface-muted)] rounded animate-pulse" />
        </div>
      </div>
    </div>
  </div>
`;

const ProfileSkeleton = () => html`
  <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-4">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-[var(--app-surface-muted)] animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-[var(--app-surface-muted)] rounded animate-pulse w-24" />
        <div className="h-3 bg-[var(--app-surface-muted)] rounded animate-pulse w-16" />
      </div>
    </div>
  </div>
`;

const GeneralFeedPortal = ({ user, view, navigate }) => {
  if (view === 'my-network') {
    return html`<${MyNetworkPage} user=${user} navigate=${navigate} />`;
  }
  if (view === 'messages') {
    return html`<${MessagesInboxView} user=${user} navigate=${navigate} />`;
  }
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedOffset, setFeedOffset] = useState(0);
  const [feedProfiles, setFeedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const isRecruiter = user?.role === 'RECRUITER';

  const loadFeed = useCallback(async (append = false) => {
    setFeedLoading(true);
    try {
      const offset = append ? feedOffset : 0;
      const res = await getFeedPosts({ limit: 20, offset });
      const items = res?.items || [];
      setFeedPosts((prev) => (append ? [...prev, ...items] : items));
      setFeedOffset(offset + items.length);
    } catch (_) {
      setFeedPosts([]);
    } finally {
      setFeedLoading(false);
    }
  }, [feedOffset]);

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const candidatesRes = await getUsers({ role: 'CANDIDATE', limit: 20 });
        const professionalsRes = await getUsers({ role: 'PROFESSIONAL', limit: 20 }).catch(() => ({ items: [] }));
        const combined = [...(candidatesRes?.items ?? []), ...(professionalsRes?.items ?? [])];
        setFeedProfiles(combined.slice(0, 24));
      } catch (_) {
        setFeedProfiles([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleProfileClick = (p) => {
    navigate(`profile/${p.id}`);
  };

  const handlePostCreated = () => loadFeed(false);
  const handleLikeOrComment = () => loadFeed(false);

  const profileCards = loading
    ? null
    : feedProfiles
        .filter((p) => p.id !== user?.id)
        .map((p, index) => {
          const profileWithHeadline = { ...p, headline: p.student_subtype || 'Professional' };
          return html`
            <div
              key=${p.id}
              className="rounded-2xl border border-[var(--app-border-soft)]/80 bg-[var(--app-surface)]/90 shadow-[var(--app-shadow-subtle)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--app-accent)]/25 hover:shadow-[var(--app-shadow-floating)] animate-in"
              style=${{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
            >
              <${ProfileCard} profile=${profileWithHeadline} viewer=${user} onClick=${() => handleProfileClick(p)} />
            </div>
          `;
        });

  const sidebarContent = html`
    <aside className="lg:sticky lg:top-5 space-y-4">
      <div className="rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-surface)]/80 px-4 py-3 shadow-[var(--app-shadow-subtle)] backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Community picks</p>
        <p className="mt-1 text-sm font-semibold text-[var(--app-text-primary)]">People you may want to connect with</p>
      </div>
      ${loading
        ? html`
            <div className="space-y-3">
              ${[1, 2, 3, 4, 5].map((i) => html`<${ProfileSkeleton} key=${i} />`)}
            </div>
          `
        : profileCards && profileCards.length > 0
          ? html`
              <div className="space-y-3">
                ${profileCards}
              </div>
            `
          : html`<p className="text-sm text-[var(--app-text-muted)] py-4">No profiles to show yet.</p>`}
    </aside>
  `;

  return html`
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-10 xl:gap-12">
        <main className="min-w-0">
          ${user ? html`<div className="mb-8"><${PostComposer} user=${user} onPost=${handlePostCreated} /></div>` : null}

          <div className="space-y-6">
            ${feedLoading
              ? html`
                  <div className="space-y-6">
                    ${[1, 2, 3].map((i) => html`<${PostSkeleton} key=${i} />`)}
                  </div>
                `
              : feedPosts.length === 0
                ? html`<${EmptyState} title="No posts yet" message="Be the first to share an update" icon=${html`<${NoPostsIcon} />`} />`
                : feedPosts.map((post) =>
                    html`<${PostCard} key=${post.id} post=${post} user=${user} onLike=${handleLikeOrComment} onComment=${handleLikeOrComment} isRecruiter=${isRecruiter} />`
                  )}
          </div>
        </main>

        <div className="hidden lg:block mt-10 lg:mt-0">
          ${sidebarContent}
        </div>
      </div>

      <div className="lg:hidden mt-10 pt-8 border-t border-[var(--app-border-soft)]">
        ${loading
          ? html`
              <div className="grid grid-cols-2 gap-3">
                ${[1, 2, 3, 4, 5, 6].map((i) => html`<${ProfileSkeleton} key=${i} />`)}
              </div>
            `
          : profileCards && profileCards.length > 0
            ? html`
                <div className="grid grid-cols-2 gap-3">
                  ${profileCards}
                </div>
              `
            : html`<p className="text-sm text-[var(--app-text-muted)] py-4">No profiles to show yet.</p>`}
      </div>
    </div>
  `;
};

export default GeneralFeedPortal;
