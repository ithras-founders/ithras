/**
 * @fileoverview JSDoc type definitions for Feed system.
 * @typedef {Object} Community
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 * @property {'institution'|'organisation'|'function'|'public'} type
 * @property {string} description
 * @property {boolean} has_channels
 * @property {number|null} institution_id
 * @property {number|null} organisation_id
 * @property {string|null} function_key
 * @property {string|null} logo_url
 * @property {string|null} cover_image_url
 * @property {number} member_count
 * @property {string} status
 * @property {string|null} created_at
 * @property {Channel[]} [channels]
 * @property {boolean} [is_member]
 *
 * @typedef {Object} Channel
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 *
 * @typedef {Object} Post
 * @property {number} id
 * @property {number} author_id
 * @property {string} author_name
 * @property {number} community_id
 * @property {number|null} channel_id
 * @property {string} community_name
 * @property {string} channel_name
 * @property {string} type — API may return legacy values; UI treats posts as discussions.
 * @property {string} title
 * @property {string} content
 * @property {string[]} tags
 * @property {Array<{url?: string, name?: string}>} attachments
 * @property {number} comment_count
 * @property {number} reaction_count
 * @property {number} save_count
 * @property {number} view_count
 * @property {'active'|'flagged'|'hidden'|'removed'} moderation_status
 * @property {string|null} created_at
 * @property {string|null} updated_at
 *
 * @typedef {Object} Comment
 * @property {number} id
 * @property {number} post_id
 * @property {number} author_id
 * @property {string} author_name
 * @property {number|null} parent_id
 * @property {string} content
 * @property {boolean} is_accepted_answer
 * @property {string|null} created_at
 *
 * @typedef {Object} CommunityRequest
 * @property {number} id
 * @property {number} user_id
 * @property {string} name
 * @property {string} description
 * @property {string} category
 * @property {string} purpose
 * @property {string[]} rules
 * @property {'pending'|'approved'|'rejected'} status
 * @property {string|null} created_at
 *
 * @typedef {Object} FeedFilterState
 * @property {string} [search]
 * @property {number} [channel_id]
 */

export const COMMUNITY_TYPES = [
  { key: 'institution', label: 'Institution' },
  { key: 'organisation', label: 'Organisation' },
  { key: 'function', label: 'Function' },
  { key: 'public', label: 'Public' },
];
