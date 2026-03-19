/**
 * @typedef {Object} Community
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 * @property {string} type
 * @property {string} description
 * @property {number|null} parentEntityId
 * @property {string|null} parentEntityName
 * @property {boolean} hasChannels
 * @property {number} memberCount
 * @property {number} [postCount]
 * @property {string} status
 * @property {string|null} createdAt
 * @property {string|null} [lastActivity]
 * @property {string} [visibility]
 * @property {boolean} [discoverable]
 * @property {boolean} [joinApprovalRequired]
 * @property {string} [postingPermission]
 * @property {string} [rules]
 */

/**
 * @typedef {Object} Channel
 * @property {number} id
 * @property {number} communityId
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {number} [postCount]
 * @property {number} [memberParticipation]
 * @property {string|null} createdAt
 */

/**
 * @typedef {Object} CommunityMember
 * @property {number} userId
 * @property {string} fullName
 * @property {string} role
 * @property {string|null} joinedAt
 * @property {string} activityLevel
 * @property {number} [postCount]
 */

/**
 * @typedef {Object} CommunityPost
 * @property {number} id
 * @property {number} authorId
 * @property {string} authorName
 * @property {string} type
 * @property {string} title
 * @property {string} channelName
 * @property {number} engagement
 * @property {string|null} createdAt
 * @property {string} moderationStatus
 * @property {boolean} [isLocked]
 */

/**
 * @typedef {Object} CommunityRequest
 * @property {number} id
 * @property {number} requesterId
 * @property {string} requesterName
 * @property {string} name
 * @property {string} description
 * @property {string} purpose
 * @property {string} [targetAudience]
 * @property {string[]} [rules]
 * @property {string} status
 * @property {string|null} createdAt
 */

/**
 * @typedef {Object} CommunityModerationAction
 * @property {number} id
 * @property {string} action
 * @property {number} adminUserId
 * @property {string} adminName
 * @property {string|null} timestamp
 * @property {Object} [details]
 */
