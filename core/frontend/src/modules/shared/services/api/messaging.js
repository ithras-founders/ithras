/** Messaging API: conversations, messages */
import { apiRequest } from './apiBase.js';

export const listConversations = () =>
  apiRequest('/v1/messaging/conversations');

export const getOrCreateDirect = (otherUserId) =>
  apiRequest(`/v1/messaging/conversations/direct/${otherUserId}`, { method: 'POST' });

export const getMessages = (conversationId, limit = 50) =>
  apiRequest(`/v1/messaging/conversations/${conversationId}/messages?limit=${limit}`);

export const sendMessage = (conversationId, body) =>
  apiRequest(`/v1/messaging/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
