/** Calendar API: slots, timetable, availability */
import { apiRequest, getApiBaseUrl } from './apiBase.js';

export const getCalendarSlots = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiRequest(`/v1/calendar-slots${params ? `?${params}` : ''}`);
};
export const getCalendarSlot = (id) => apiRequest(`/v1/calendar-slots/${id}`);
export const getSlotAvailability = (slotId, companyId, processStage = 'BEFORE_APPLICATIONS') => {
  const params = new URLSearchParams({ company_id: companyId, process_stage: processStage }).toString();
  return apiRequest(`/v1/calendar-slots/${slotId}/availability?${params}`);
};
export const createCalendarSlot = (slotData) =>
  apiRequest('/v1/calendar-slots', { method: 'POST', body: JSON.stringify(slotData) });
export const updateCalendarSlot = (id, slotData) =>
  apiRequest(`/v1/calendar-slots/${id}`, { method: 'PUT', body: JSON.stringify(slotData) });
export const deleteCalendarSlot = (id) =>
  apiRequest(`/v1/calendar-slots/${id}`, { method: 'DELETE' });
export const bookSlot = (slotId, bookingData) =>
  apiRequest(`/v1/calendar-slots/${slotId}/book`, { method: 'POST', body: JSON.stringify(bookingData) });

export const getTimetableBlocks = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiRequest(`/v1/timetable-blocks${params ? `?${params}` : ''}`);
};
export const getTimetableBlock = (id) => apiRequest(`/v1/timetable-blocks/${id}`);
export const createTimetableBlock = (blockData) =>
  apiRequest('/v1/timetable-blocks', { method: 'POST', body: JSON.stringify(blockData) });
export const updateTimetableBlock = (id, blockData) =>
  apiRequest(`/v1/timetable-blocks/${id}`, { method: 'PUT', body: JSON.stringify(blockData) });
export const deleteTimetableBlock = (id) =>
  apiRequest(`/v1/timetable-blocks/${id}`, { method: 'DELETE' });

export const getSlotAvailabilityDetails = (slotId, companyId, processStage = 'BEFORE_APPLICATIONS') => {
  const params = new URLSearchParams({ company_id: companyId, process_stage: processStage }).toString();
  return apiRequest(`/v1/availability/slot/${slotId}?${params}`);
};
export const getStudentAvailability = (studentId, startDate = null, endDate = null) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  return apiRequest(`/v1/availability/student/${studentId}${params.toString() ? `?${params}` : ''}`);
};

export const getAvailabilityAggregate = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiRequest(`/v1/availability/aggregate${params ? `?${params}` : ''}`);
};

export const getStudentRelevantSlots = (studentId, startDate = null, endDate = null) => {
  const params = new URLSearchParams({ student_id: studentId });
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  return apiRequest(`/v1/availability/student-slots?${params}`);
};
