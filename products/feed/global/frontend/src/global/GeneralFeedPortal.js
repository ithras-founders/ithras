import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import htm from 'htm';
import {
  createFeedPost,
  getFeedPosts,
  likeFeedPost,
  addFeedComment,
  getFeedComments,
  recordFeedPostView,
  uploadFeedImage,
} from '/core/frontend/src/modules/shared/services/api.js';
import { apiRequest } from '/core/frontend/src/modules/shared/services/api/apiBase.js';
import EmptyState from '/core/frontend/src/modules/shared/components/EmptyState.js';
import MyNetworkPage from './MyNetworkPage.js';
import MessagesInboxView from './MessagesInboxView.js';
import FeedCommunitiesView from '/products/feed/community/frontend/src/FeedCommunitiesView.js';
import CommunityPageView from '/products/feed/community/frontend/src/CommunityPageView.js';
import FeedUtilityWing from './FeedUtilityWing.js';
import FeedLeftNav from '/products/feed/core/frontend/src/FeedLeftNav.js';
import { FeedSidebarRefreshContext } from '/products/feed/core/frontend/src/FeedSidebarRefreshContext.js';
import { iconMap } from '/core/frontend/src/modules/shared/ui/icons/iconMap.js';

const html = htm.bind(React.createElement);

const statusBadgeClasses = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'required') return 'bg-red-50 text-red-700';
  if (s === 'recommended') return 'bg-emerald-50 text-emerald-700';
  return 'bg-orange-50 text-orange-700';
};

const MissionControlCard = ({ icon: Icon, title, description, onAction, actionLabel, status = 'Recommended', iconBg = 'bg-blue-50', iconColor = 'text-blue-600' }) => html`
  <button
    onClick=${onAction}
    className="w-full text-left rounded-lg bg-white p-4 shadow-[0 1px 3px rgba(0,0,0,0.08)] hover:shadow-[0 4px 12px rgba(0,0,0,0.1)] transition-all duration-200 group overflow-hidden"
  >
    <div className="flex items-start gap-4 min-w-0">
      <div className=${`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${iconBg} ${iconColor}`}>
        <${Icon} className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-[#0F172A] break-words line-clamp-2 min-w-0">${title}</h4>
          <span className=${`text-[10px] font-bold uppercase tracking-wider shrink-0 px-2 py-1 rounded ${statusBadgeClasses(status)}`}>${status}</span>
        </div>
        <p className="text-sm text-[var(--slate-500)] mb-3 line-clamp-2">${description}</p>
        <span className="text-sm font-medium text-[var(--cobalt-600)] group-hover:underline">${actionLabel} →</span>
      </div>
    </div>
  </button>
`;

const Sparkline = ({ points = [2, 4, 3, 6, 5, 8, 7], width = 48, height = 24 }) => {
  const mx = Math.max(...points);
  const mn = Math.min(...points);
  const range = mx - mn || 1;
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => `${i * step},${height - ((p - mn) / range) * (height - 2) - 1}`).join(' ');
  return html`
    <svg width=${width} height=${height} className="flex-shrink-0 opacity-70">
      <polyline fill="none" stroke="var(--indigo-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points=${coords} />
    </svg>
  `;
};

const QuickStatsBar = ({ stats }) => {
  const items = [
    { label: 'Posts today', value: stats?.postsToday ?? '—', key: 'posts', trend: [1, 2, 1, 3, 2, 4, 3] },
    { label: 'Mocks taken', value: stats?.mocksToday ?? '—', key: 'mocks', trend: [0, 1, 1, 2, 2, 3, 2] },
    { label: 'Active prep', value: stats?.activePreppers ?? '—', key: 'active', trend: [2, 3, 4, 5, 4, 6, 7] },
  ];
  return html`
    <div className="rounded-lg bg-white p-4 shadow-[0 1px 3px rgba(0,0,0,0.08)] flex items-center gap-8 sm:gap-12">
      ${items.map((i) => html`
        <div key=${i.key} className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-bold text-[#0F172A]">${i.value}</span>
            <span className="text-xs font-medium text-[var(--slate-500)] truncate">${i.label}</span>
          </div>
          <${Sparkline} points=${i.trend} />
        </div>
      `)}
    </div>
  `;
};

const MissionControl = ({ navigate, onboardingPct = 33 }) => html`
  <div className="space-y-10">
    <div className="text-center mb-10">
      <h2 className="text-2xl font-semibold text-[#0F172A] mb-2">Mission Control</h2>
      <p className="text-[var(--slate-500)]">Get started with these key steps to boost your readiness.</p>
    </div>
    <div className="mb-10">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-[var(--slate-500)]">Onboarding Completion</span>
        <span className="text-sm font-bold text-[var(--cobalt-600)]">${onboardingPct}%</span>
      </div>
      <div className="h-2 rounded-lg bg-[#E2E8F0] overflow-hidden">
        <div className="h-full rounded-lg bg-[var(--cobalt-600)] transition-all duration-500" style=${{ width: `${onboardingPct}%` }} />
      </div>
    </div>
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
      <${MissionControlCard}
        icon=${iconMap.badgeCheck}
        title="Complete your Profile Verification"
        description="Verify your profile to build trust and stand out to recruiters."
        onAction=${() => navigate?.('profile/me')}
        actionLabel="Go to Profile"
        status="Required"
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
      />
      <${MissionControlCard}
        icon=${iconMap.video}
        title="Join your first Mock Interview"
        description="Practice with peers and mentors to prepare for the real thing."
        onAction=${() => navigate?.('preparation')}
        actionLabel="Explore Preparation"
        status="Recommended"
        iconBg="bg-violet-50"
        iconColor="text-violet-600"
      />
      <${MissionControlCard}
        icon=${iconMap.fileUp}
        title="Upload your Resume for AI Analysis"
        description="Get AI-powered feedback to strengthen your CV."
        onAction=${() => navigate?.('cv-maker')}
        actionLabel="Open CV Maker"
        status="Required"
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
      />
    </div>
  </div>
`;

const EmptyFeedIllustration = () => html`
  <svg className="w-24 h-24 text-[var(--slate-500)]" viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="10" width="44" height="32" rx="4" />
    <path d="M8 22h44M16 30h28" />
    <rect x="68" y="34" width="44" height="32" rx="4" />
    <path d="M68 46h44M76 54h28" />
    <circle cx="60" cy="58" r="16" strokeDasharray="4 3" />
    <path d="M55 58h10M60 53v10" />
    <circle cx="32" cy="28" r="4" fill="var(--cobalt-soft)" stroke="var(--cobalt-500)" />
    <circle cx="92" cy="52" r="4" fill="var(--cobalt-soft)" stroke="var(--cobalt-500)" />
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

const POST_TYPES = [
  { id: 'standard', label: 'Thought or update', postType: 'standard', icon: iconMap.penLine, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
  { id: 'share_resource', label: 'Share a Resource', postType: 'share_resource', icon: iconMap.bookOpen, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { id: 'cv_review', label: 'Ask for CV Review', postType: 'cv_review_request', icon: iconMap.audit, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  { id: 'mock_interview', label: 'Mock Interview Request', postType: 'mock_interview_request', icon: iconMap.video, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
];

const CommandBar = ({ user, onPost, expanded: expandedProp, onExpandedChange }) => {
  const [expandedInternal, setExpandedInternal] = useState(false);
  const expanded = expandedProp ?? expandedInternal;
  const setExpanded = (v) => {
    if (onExpandedChange) onExpandedChange(v);
    else setExpandedInternal(v);
  };
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState('standard');

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
      await createFeedPost(text.trim(), images, selectedPostType);
      setText('');
      setImages([]);
      setSelectedPostType('standard');
      setExpanded(false);
      onPost?.();
    } catch (err) {
      console.error('Post failed:', err);
    } finally {
      setPosting(false);
    }
  };

  const handlePostTypeSelect = (postType) => {
    setSelectedPostType(postType);
    setExpanded(true);
  };

  const avatarEl = html`
    <div className="w-10 h-10 rounded-full bg-[var(--cobalt-soft)] flex items-center justify-center text-[var(--cobalt-600)] font-semibold flex-shrink-0 overflow-hidden">
      ${user?.profile_photo_url
        ? html`<img src=${user.profile_photo_url} alt="" className="w-full h-full object-cover" />`
        : html`<span>${(user?.name || user?.email || '?').charAt(0).toUpperCase()}</span>`}
    </div>
  `;

  return html`
    <div className="bg-white rounded-lg shadow-[0 1px 3px rgba(0,0,0,0.08)] hover:shadow-[0 4px 12px rgba(0,0,0,0.1)] transition-all duration-200 overflow-hidden">
      ${!expanded ? html`
        <div className="flex items-center gap-3 p-3">
          ${avatarEl}
          <button
            onClick=${() => setExpanded(true)}
            className="flex-1 text-left px-4 py-2.5 rounded-lg border border-[var(--slate-200)] bg-white/60 backdrop-blur-sm text-[var(--slate-500)] hover:bg-white/80 hover:text-[var(--feed-text-secondary)] transition-all duration-200"
          >
            Share a thought, update, or milestone...
          </button>
        </div>
      ` : html`
        <div className="p-3 space-y-4">
          <div className="flex items-start gap-3">
            ${avatarEl}
            <textarea
              placeholder="What's on your mind?"
              value=${text}
              onChange=${(e) => setText(e.target.value)}
              className="flex-1 min-h-[80px] p-3 rounded-lg border border-[#E2E8F0] bg-white text-[var(--feed-text-primary)] placeholder-[#475569] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cobalt-600)]/30 focus:border-[var(--cobalt-600)]/50"
              rows=${3}
              autoFocus
            />
          </div>
          ${images.length > 0 ? html`
            <div className="flex flex-wrap gap-2">
              ${images.map((url, i) => html`
                <div key=${i} className="relative group">
                  <img src=${url} alt="" className="w-20 h-20 object-cover rounded-lg border border-[var(--feed-border)]" />
                  <button type="button" onClick=${() => removeImage(i)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--app-danger)] text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              `)}
            </div>
          ` : null}
          <div className="space-y-3">
            <p className="text-xs font-medium text-[var(--slate-500)]">Post type</p>
            <div className="flex flex-wrap gap-2">
              ${POST_TYPES.map((qa) => {
                const Icon = qa.icon;
                const isSelected = selectedPostType === qa.postType;
                return html`
                  <button
                    key=${qa.id}
                    onClick=${() => handlePostTypeSelect(qa.postType)}
                    className=${`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 ${isSelected
                      ? `border-[var(--cobalt-600)] bg-[var(--cobalt-soft)] shadow-[0 0 0 1px var(--cobalt-600)]`
                      : 'border-[var(--slate-200)] bg-white hover:border-[var(--slate-300)] hover:shadow-[0 2px 6px rgba(0,0,0,0.06)]'}`}
                  >
                    <div className=${`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? qa.iconBg : 'bg-[var(--slate-100)]'} ${isSelected ? qa.iconColor : 'text-[var(--slate-500)]'}`}>
                      <${Icon} className="w-4 h-4" />
                    </div>
                    <span className=${`text-sm font-medium ${isSelected ? 'text-[var(--cobalt-600)]' : 'text-[var(--slate-700)]'}`}>${qa.label}</span>
                  </button>
                `;
              })}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 flex-shrink-0 border-t border-[#E2E8F0] pt-4 mt-1">
            <label className="cursor-pointer flex items-center gap-1.5 text-[var(--slate-500)] hover:text-[var(--cobalt-600)] text-xs font-medium">
              <input type="file" accept="image/*" multiple onChange=${handleImageSelect} disabled=${uploading} className="hidden" />
              ${ImageIcon({ className: 'w-4 h-4' })} ${uploading ? 'Uploading...' : 'Add photos'}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick=${() => setExpanded(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--slate-600)] hover:text-[var(--feed-text-primary)] transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick=${handlePost}
                disabled=${posting || ((!text || !text.trim()) && images.length === 0)}
                className="px-6 py-2.5 rounded-lg bg-[var(--cobalt-600)] text-white font-semibold text-sm hover:bg-[var(--cobalt-500)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0 2px 4px rgba(15,23,74,0.2)]"
              >
                ${posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      `}
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

  const VerifiedBadge = () => html`<${iconMap.badgeCheck} className="w-4 h-4 text-[var(--cobalt-600)] flex-shrink-0" title="Verified" />`;
  return html`
    <div className="bg-white rounded-lg p-5 shadow-[0 1px 3px rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0 4px 12px rgba(0,0,0,0.1)]">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-[var(--cobalt-soft)] flex items-center justify-center text-[var(--cobalt-600)] font-semibold flex-shrink-0 overflow-hidden ring-2 ring-[var(--feed-border)]">
          ${authorPhoto
            ? html`<img src=${authorPhoto} alt="" className="w-full h-full object-cover" />`
            : html`<span>${authorInitial}</span>`}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--feed-text-primary)]">${post.author_name || 'Unknown'}</span>
            ${post.author_is_verified ? html`<${VerifiedBadge} />` : null}
            ${post.author_recently_active ? html`<span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--cobalt-soft)] text-[var(--cobalt-600)] font-semibold uppercase tracking-wide">Recently active</span>` : null}
            <span className="text-sm text-[#475569]">· ${formatTimeAgo(post.created_at)}</span>
          </div>
          ${post.text ? html`<p className="mt-3 text-[var(--feed-text-primary)] whitespace-pre-wrap leading-relaxed font-medium">${post.text}</p>` : null}
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
              className="flex items-center gap-2 text-[#475569] hover:text-[var(--cobalt-600)] disabled:opacity-50 transition-all duration-200 ${post.liked ? 'text-[var(--cobalt-600)]' : ''}"
            >
              ${HeartIcon({ filled: !!post.liked, className: 'w-5 h-5' })}
              <span>${post.like_count ?? 0}</span>
            </button>
            <button
              onClick=${() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-[#475569] hover:text-[var(--cobalt-600)] transition-all duration-200 ${showComments ? 'text-[var(--cobalt-600)]' : ''}"
            >
              ${CommentIcon({ className: 'w-5 h-5' })}
              <span>${post.comment_count ?? 0}</span>
            </button>
            ${isRecruiter && (post.view_count ?? 0) > 0
              ? html`<span className="flex items-center gap-2 text-[#475569]">${EyeIcon({ className: 'w-5 h-5' })} ${post.view_count}</span>`
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
                            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[var(--slate-100)]/50 text-[var(--feed-text-primary)] placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[var(--cobalt-600)]/30 transition-all duration-200"
                          />
                          <button
                            onClick=${handleSubmitComment}
                            disabled=${!commentText.trim() || submittingComment}
                            className="px-4 py-2.5 rounded-xl bg-[var(--cobalt-600)] text-white font-medium text-sm disabled:opacity-50 transition-all duration-200"
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
  <div className="bg-white rounded-lg p-6 shadow-[0 1px 3px rgba(0,0,0,0.08)]">
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

const GeneralFeedPortal = ({ user, view, navigate, profiles, activeProfile, onSwitchProfile }) => {
  if (view === 'my-network') {
    return html`<${MyNetworkPage} user=${user} navigate=${navigate} />`;
  }
  if (view === 'messages') {
    return html`<${MessagesInboxView} user=${user} navigate=${navigate} />`;
  }

  const viewParts = (view || 'feed').split('/').filter(Boolean);
  const isPostDetail = viewParts[2] === 'post' && !!viewParts[3];
  const communityChannel = !isPostDetail && viewParts[0] === 'feed' && viewParts[1] === 'communities' && viewParts[2] && viewParts[2] !== 'post' ? viewParts[2] : null;
  const communityCode = viewParts[0] === 'feed' && viewParts[1] === 'community' && viewParts[2] ? viewParts[2] : null;
  const isGlobalFeed = view === 'feed' || (viewParts[0] === 'feed' && !viewParts[1] && !viewParts[2]);
  const isCommunitiesAll = view === 'feed/communities' || (viewParts[1] === 'communities' && !communityChannel && !isPostDetail);
  const isCommunityPage = !!communityCode;

  const feedSidebarRefresh = useContext(FeedSidebarRefreshContext)?.refresh;
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedQuickStats, setFeedQuickStats] = useState(null);
  const feedOffsetRef = useRef(0);
  const isRecruiter = user?.role === 'RECRUITER';

  const loadQuickStats = useCallback(async () => {
    try {
      const [postsRes, catRes] = await Promise.all([
        apiRequest('/v1/feed/posts?limit=100', { method: 'GET', quiet: true }),
        apiRequest('/v1/prep-cat/history?limit=500', { method: 'GET', quiet: true }),
      ]);
      const today = new Date().toDateString();
      const posts = postsRes?.items || [];
      const postsToday = posts.filter((p) => p.created_at && new Date(p.created_at).toDateString() === today).length;
      const mocks = catRes?.items || [];
      const mocksToday = mocks.filter((m) => m.completed_at && new Date(m.completed_at).toDateString() === today).length;
      setFeedQuickStats({ postsToday, mocksToday, activePreppers: postsToday + mocksToday || '—' });
    } catch (_) {
      setFeedQuickStats({});
    }
  }, []);

  const loadFeed = useCallback(async (append = false) => {
    setFeedLoading(true);
    try {
      const offset = append ? feedOffsetRef.current : 0;
      const res = await getFeedPosts({ limit: 20, offset });
      const items = res?.items || [];
      setFeedPosts((prev) => (append ? [...prev, ...items] : items));
      feedOffsetRef.current = offset + items.length;
    } catch (_) {
      setFeedPosts([]);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isGlobalFeed) loadFeed();
  }, [isGlobalFeed, loadFeed]);

  useEffect(() => {
    if (isGlobalFeed && feedPosts.length === 0 && !feedLoading) loadQuickStats();
  }, [isGlobalFeed, feedPosts.length, feedLoading, loadQuickStats]);

  const handlePostCreated = () => loadFeed(false);
  const handleLikeOrComment = () => loadFeed(false);

  const [commandBarExpanded, setCommandBarExpanded] = useState(false);
  const mainContent = isGlobalFeed
    ? html`
        ${user ? html`<div className="mb-12"><${CommandBar} user=${user} onPost=${handlePostCreated} expanded=${commandBarExpanded} onExpandedChange=${setCommandBarExpanded} /></div>` : null}
        <div className="space-y-12">
          ${feedLoading
            ? html`<div className="space-y-12">${[1, 2, 3].map((i) => html`<${PostSkeleton} key=${i} />`)}</div>`
            : feedPosts.length === 0
              ? html`
                <${MissionControl} navigate=${navigate} />
                <${QuickStatsBar} stats=${feedQuickStats} />
              `
              : feedPosts.map((post) =>
                  html`<${PostCard} key=${post.id} post=${post} user=${user} onLike=${handleLikeOrComment} onComment=${handleLikeOrComment} isRecruiter=${isRecruiter} />`
                )}
        </div>
      `
    : isCommunityPage
      ? html`<${CommunityPageView} user=${user} communityCode=${communityCode} navigate=${navigate} onJoinLeave=${feedSidebarRefresh} />`
      : html`<${FeedCommunitiesView} user=${user} view=${view} navigate=${navigate} />`;

  return html`
    <div className="min-h-full bg-[var(--feed-bg)]">
      <main className="py-8 lg:py-10 px-8 sm:px-12 lg:px-16">
        <div className="max-w-full min-w-0">
          ${mainContent}
        </div>
      </main>
      <div className="lg:hidden border-t border-[var(--feed-border)] bg-[var(--feed-surface)] p-4 overflow-x-auto">
        <${FeedLeftNav}
          user=${user}
          navigate=${navigate}
          activeView=${view}
          profiles=${profiles}
          activeProfile=${activeProfile}
          onSwitchProfile=${onSwitchProfile}
          collapsed=${false}
          compact=${true}
        />
      </div>
    </div>
  `;
};

export default GeneralFeedPortal;
