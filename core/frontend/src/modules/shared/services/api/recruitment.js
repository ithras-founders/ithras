/** Recruitment API: AI shortlist, schedule interview */
import { apiRequest } from './apiBase.js';

export const generateAIShortlist = (body) =>
  apiRequest('/v1/recruitment/ai-shortlist', { method: 'POST', body: JSON.stringify(body) });

export const scheduleInterview = (body) =>
  apiRequest('/v1/recruitment/schedule-interview', { method: 'POST', body: JSON.stringify(body) });
