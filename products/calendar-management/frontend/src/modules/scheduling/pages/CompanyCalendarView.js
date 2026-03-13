import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getCalendarSlots, getSlotAvailability, createCalendarSlot, bookSlot, getCompanies, getJobs } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { isDemoUser } from '/core/frontend/src/modules/shared/utils/demoUtils.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';

const html = htm.bind(React.createElement);

const CompanyCalendarView = ({ user }) => {
  const toast = useToast();
  const { isTutorialMode, getTutorialData } = useTutorialContext();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [processStage, setProcessStage] = useState('BEFORE_APPLICATIONS');
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    if (isTutorialMode || isDemoUser(user)) {
      const mock = getTutorialData?.('RECRUITER') ?? getTutorialMockData('RECRUITER');
      const now = new Date();
      const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
      const dayAfter = new Date(now); dayAfter.setDate(now.getDate() + 2);
      const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 5);
      setSlots([
        { id: 'slot1', start_time: new Date(tomorrow.setHours(10, 0)).toISOString(), end_time: new Date(tomorrow.setHours(11, 0)).toISOString(), slot_type: 'INTERVIEW', status: 'AVAILABLE', job_id: 'j1' },
        { id: 'slot2', start_time: new Date(tomorrow.setHours(14, 0)).toISOString(), end_time: new Date(tomorrow.setHours(15, 30)).toISOString(), slot_type: 'PRESENTATION', status: 'BOOKED', job_id: 'j2' },
        { id: 'slot3', start_time: new Date(dayAfter.setHours(9, 0)).toISOString(), end_time: new Date(dayAfter.setHours(10, 0)).toISOString(), slot_type: 'INTERVIEW', status: 'AVAILABLE', job_id: 'j1' },
        { id: 'slot4', start_time: new Date(nextWeek.setHours(11, 0)).toISOString(), end_time: new Date(nextWeek.setHours(12, 30)).toISOString(), slot_type: 'NETWORKING', status: 'AVAILABLE', job_id: null },
      ]);
      setCompanies(mock.companies || []);
      setJobs(mock.jobs || []);
      setLoading(false);
      return;
    }
    fetchSlots();
    fetchCompanies();
    fetchJobs();
  }, [user?.company_id, selectedDate, isTutorialMode, getTutorialData]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const startDate = new Date(selectedDate);
      startDate.setDate(1);
      const endDate = new Date(selectedDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      const data = await getCalendarSlots({
        company_id: user.company_id,
        institution_id: user.institution_id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
      setSlots(data);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await getCompanies({ limit: 500 });
      setCompanies(data?.items ?? []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await getJobs({ company_id: user.company_id });
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const handleCreateSlot = async (slotData) => {
    try {
      await createCalendarSlot({
        ...slotData,
        company_id: user.company_id,
        institution_id: user.institution_id
      });
      setShowCreateModal(false);
      fetchSlots();
    } catch (error) {
      toast.error('Failed to create slot: ' + (error.message || 'Unknown error'));
    }
  };

  const handleBookSlot = async (slotId) => {
    try {
      await bookSlot(slotId, { company_id: user.company_id });
      toast.success('Slot booked successfully!');
      fetchSlots();
    } catch (error) {
      toast.error('Failed to book slot: ' + (error.message || 'Unknown error'));
    }
  };

  const getAvailabilityColor = (count, total) => {
    if (!total || total === 0) return 'bg-[var(--app-bg-elevated)] text-[var(--app-text-muted)]';
    const percentage = (count / total) * 100;
    if (percentage >= 70) return 'bg-[rgba(5,150,105,0.14)] text-[var(--app-success)]';
    if (percentage >= 40) return 'bg-[rgba(245,158,11,0.14)] text-[rgb(146,64,14)]';
    return 'bg-[rgba(220,38,38,0.14)] text-[var(--app-danger)]';
  };

  if (loading) {
    return html`<div className="p-20 text-center font-semibold text-[var(--app-text-muted)] text-3xl italic">Loading...</div>`;
  }

  return html`
    <div className="space-y-8 animate-in pb-20">
      <div data-tour-id="recruiter-calendar-header" className="flex justify-end">
        <div className="flex gap-3">
          <select
            value=${processStage}
            onChange=${(e) => setProcessStage(e.target.value)}
            className="px-4 py-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)] text-sm font-bold"
          >
            <option value="BEFORE_APPLICATIONS">Before Applications</option>
            <option value="APPLICATIONS_SUBMITTED">After Applications</option>
            <option value="SHORTLISTED">After Shortlisting</option>
          </select>
          <button
            onClick=${() => setShowCreateModal(true)}
            className="px-8 py-3 bg-[var(--app-accent)] text-white rounded-[var(--app-radius-md)] text-[11px] font-semibold uppercase tracking-widest shadow-[var(--app-shadow-card)] hover:bg-[var(--app-accent-hover)] transition-colors"
          >
            + Create Slot
          </button>
        </div>
      </div>

      <div data-tour-id="recruiter-calendar-grid" className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
        <div className="grid grid-cols-7 gap-2 mb-6">
          ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => html`
            <div key=${day} className="text-center text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest py-2">
              ${day}
            </div>
          `)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          ${Array.from({ length: 35 }, (_, i) => {
            const date = new Date(selectedDate);
            date.setDate(1);
            date.setDate(date.getDate() + i - date.getDay() + 1);
            const daySlots = slots.filter(s => {
              const slotDate = new Date(s.start_time);
              return slotDate.toDateString() === date.toDateString();
            });
            
            return html`
              <div key=${i} className="min-h-[100px] p-2 border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)] ${date.getMonth() !== selectedDate.getMonth() ? 'opacity-30' : ''}">
                <div className="text-xs font-bold text-[var(--app-text-secondary)] mb-2">${date.getDate()}</div>
                <div className="space-y-1">
                  ${daySlots.map(slot => html`
                    <div
                      key=${slot.id}
                      onClick=${() => setSelectedSlot(slot)}
                      className="p-2 bg-[var(--app-accent-soft)] rounded-lg cursor-pointer hover:bg-[rgba(0,113,227,0.14)] transition-colors"
                    >
                      <div className="text-[10px] font-bold text-[var(--app-accent-hover)]">${new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[9px] text-[var(--app-accent)]">${slot.slot_type}</div>
                    </div>
                  `)}
                </div>
              </div>
            `;
          })}
        </div>
      </div>

      ${selectedSlot && html`
        <${SlotDetailsModal}
          slot=${selectedSlot}
          companyId=${user.company_id}
          processStage=${processStage}
          onClose=${() => setSelectedSlot(null)}
          onBook=${handleBookSlot}
        />
      `}

      ${showCreateModal && html`
        <${CreateSlotModal}
          jobs=${jobs}
          onClose=${() => setShowCreateModal(false)}
          onCreate=${handleCreateSlot}
        />
      `}
    </div>
  `;
};

const SlotDetailsModal = ({ slot, companyId, processStage, onClose, onBook }) => {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailability();
  }, [slot.id, companyId, processStage]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const data = await getSlotAvailability(slot.id, companyId, processStage);
      setAvailability(data);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
    }
  };

  return html`
    <div className="fixed inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" onClick=${onClose}>
      <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick=${(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-[var(--app-text-primary)]">Slot Details</h3>
          <button onClick=${onClose} className="p-2 hover:bg-[var(--app-bg-elevated)] rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-1">Time</p>
            <p className="text-lg font-bold text-[var(--app-text-primary)]">
              ${new Date(slot.start_time).toLocaleString()} - ${new Date(slot.end_time).toLocaleString()}
            </p>
          </div>
          
          <div>
            <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-1">Type</p>
            <p className="text-lg font-bold text-[var(--app-text-primary)]">${slot.slot_type}</p>
          </div>
          
          ${loading ? html`
            <div className="p-8 text-center text-[var(--app-text-muted)]">Loading availability...</div>
          ` : availability && html`
            <div className="p-6 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)]">
              <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-3">Availability</p>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-semibold text-[var(--app-text-primary)]">${availability.availability_count}</div>
                <div className="text-sm text-[var(--app-text-secondary)]">
                  out of <span className="font-bold">${availability.total_count}</span> students available
                </div>
              </div>
              <p className="text-xs text-[var(--app-text-muted)] mt-2">Stage: ${processStage.replace('_', ' ')}</p>
            </div>
          `}
          
          ${slot.status === 'AVAILABLE' && html`
            <button
              onClick=${() => onBook(slot.id)}
              className="w-full py-3 bg-[var(--app-accent)] text-white rounded-[var(--app-radius-sm)] text-sm font-semibold uppercase tracking-widest hover:bg-[var(--app-accent-hover)] transition-colors"
            >
              Book Slot
            </button>
          `}
        </div>
      </div>
    </div>
  `;
};

const CreateSlotModal = ({ jobs, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    job_id: '',
    start_time: '',
    end_time: '',
    slot_type: 'INTERVIEW',
    max_capacity: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...formData,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
      max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null
    });
  };

  return html`
    <div className="fixed inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" onClick=${onClose}>
      <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] p-8 max-w-lg w-full" onClick=${(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-[var(--app-text-primary)]">Create Slot</h3>
          <button onClick=${onClose} className="p-2 hover:bg-[var(--app-bg-elevated)] rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit=${handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Job (Optional)</label>
            <select
              value=${formData.job_id}
              onChange=${(e) => setFormData({ ...formData, job_id: e.target.value })}
              className="w-full px-4 py-3 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)]"
            >
              <option value="">None</option>
              ${jobs.map(job => html`<option key=${job.id} value=${job.id}>${job.title}</option>`)}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Start Time</label>
            <input
              type="datetime-local"
              value=${formData.start_time}
              onChange=${(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-4 py-3 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)]"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">End Time</label>
            <input
              type="datetime-local"
              value=${formData.end_time}
              onChange=${(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full px-4 py-3 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)]"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Slot Type</label>
            <select
              value=${formData.slot_type}
              onChange=${(e) => setFormData({ ...formData, slot_type: e.target.value })}
              className="w-full px-4 py-3 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)]"
            >
              <option value="INTERVIEW">Interview</option>
              <option value="PRESENTATION">Presentation</option>
              <option value="NETWORKING">Networking</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Max Capacity (Optional)</label>
            <input
              type="number"
              value=${formData.max_capacity || ''}
              onChange=${(e) => setFormData({ ...formData, max_capacity: e.target.value })}
              className="w-full px-4 py-3 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)]"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick=${onClose}
              className="flex-1 px-6 py-3 bg-[var(--app-bg-elevated)] text-[var(--app-text-primary)] rounded-[var(--app-radius-sm)] text-sm font-semibold uppercase tracking-widest hover:bg-[var(--app-bg-elevated)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[var(--app-accent)] text-white rounded-[var(--app-radius-sm)] text-sm font-semibold uppercase tracking-widest hover:bg-[var(--app-accent-hover)] transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
};

export default CompanyCalendarView;
