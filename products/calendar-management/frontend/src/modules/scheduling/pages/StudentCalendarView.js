import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getTimetableBlocks, createTimetableBlock, updateTimetableBlock, deleteTimetableBlock, getStudentRelevantSlots } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';
import { isDemoId } from '/core/frontend/src/modules/shared/utils/demoUtils.js';
import TimetableBlockEditor from '../components/TimetableBlockEditor.js';

const html = htm.bind(React.createElement);

const StudentCalendarView = ({ user }) => {
  const toast = useToast();
  const { confirm } = useDialog();
  const { isTutorialMode, getTutorialData } = useTutorialContext();
  const showAICalendarBanner = isTutorialMode || isDemoId(user?.id);
  const [blocks, setBlocks] = useState([]);
  const [companySlots, setCompanySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);

  useEffect(() => {
    if (isTutorialMode || isDemoId(user?.id)) {
      const mock = getTutorialData?.('CANDIDATE') ?? getTutorialMockData('CANDIDATE');
      setBlocks(mock.timetableBlocks || []);
      setCompanySlots([
        { id: 'cs1', start_time: new Date(Date.now() + 86400000).toISOString(), end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(), slot_type: 'INTERVIEW', company_id: 'c1' },
        { id: 'cs2', start_time: new Date(Date.now() + 172800000).toISOString(), end_time: new Date(Date.now() + 172800000 + 5400000).toISOString(), slot_type: 'PRESENTATION', company_id: 'c2' },
        { id: 'cs3', start_time: new Date(Date.now() + 345600000).toISOString(), end_time: new Date(Date.now() + 345600000 + 3600000).toISOString(), slot_type: 'NETWORKING', company_id: 'c4' },
      ]);
      setLoading(false);
      return;
    }
    fetchBlocks();
    fetchCompanySlots();
  }, [user?.id, isTutorialMode]);

  const fetchCompanySlots = async () => {
    try {
      const start = new Date();
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 2);
      const data = await getStudentRelevantSlots(user.id, start.toISOString(), end.toISOString());
      setCompanySlots(data?.slots || []);
    } catch (e) {
      setCompanySlots([]);
    }
  };

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const data = await getTimetableBlocks({ student_id: user.id });
      setBlocks(data);
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (blockData) => {
    try {
      if (editingBlock) {
        await updateTimetableBlock(editingBlock.id, blockData);
      } else {
        await createTimetableBlock({
          ...blockData,
          student_id: user.id,
          institution_id: user.institution_id
        });
      }
      setShowEditor(false);
      setEditingBlock(null);
      fetchBlocks();
    } catch (error) {
      toast.error('Failed to save block: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (blockId) => {
    if (!(await confirm({ message: 'Are you sure you want to delete this block?' }))) return;
    
    try {
      await deleteTimetableBlock(blockId);
      fetchBlocks();
    } catch (error) {
      toast.error('Failed to delete block: ' + (error.message || 'Unknown error'));
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const blockTypes = {
    CLASS: 'bg-[rgba(0,113,227,0.14)] text-[var(--app-accent-hover)]',
    EXAM: 'bg-[rgba(220,38,38,0.14)] text-[var(--app-danger)]',
    PERSONAL: 'bg-[rgba(147,51,234,0.14)] text-[rgb(126,34,206)]',
    INTERVIEW: 'bg-emerald-100 text-emerald-700',
    PRESENTATION: 'bg-amber-100 text-amber-700',
    NETWORKING: 'bg-sky-100 text-sky-700',
    PLACEMENT: 'bg-sky-100 text-sky-700',
  };

  if (loading) {
    return html`<div className="p-20 text-center font-semibold text-[var(--app-text-muted)] text-3xl italic">Loading...</div>`;
  }

  return html`
    <div className="space-y-8 animate-in pb-20">
      ${showAICalendarBanner ? html`
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
            <p className="text-[10px] font-semibold text-violet-600 uppercase">AI Conflict Check</p>
            <p className="text-2xl font-semibold text-[var(--app-text-primary)]">0 conflicts</p>
            <p className="text-xs text-[var(--app-text-secondary)] mt-1">Interview slots vs your timetable</p>
          </div>
          <div className="bg-[var(--app-accent-soft)] border border-blue-200 rounded-2xl p-4">
            <p className="text-[10px] font-semibold text-[var(--app-accent)] uppercase">Candidates Available</p>
            <p className="text-2xl font-semibold text-[var(--app-text-primary)]">42</p>
            <p className="text-xs text-[var(--app-text-secondary)] mt-1">This week for scheduling</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase">Open Slots</p>
            <p className="text-2xl font-semibold text-[var(--app-text-primary)]">12</p>
            <p className="text-xs text-[var(--app-text-secondary)] mt-1">Recruiter interview slots</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-[10px] font-semibold text-amber-600 uppercase">Blocked</p>
            <p className="text-2xl font-semibold text-[var(--app-text-primary)]">6</p>
            <p className="text-xs text-[var(--app-text-secondary)] mt-1">Classes & exams</p>
          </div>
        </div>
      ` : null}
      <div data-tour-id="calendar-header" className="flex justify-end">
        <button
          onClick=${() => { setEditingBlock(null); setShowEditor(true); }}
          className="px-8 py-3 bg-[var(--app-accent)] text-white rounded-[var(--app-radius-md)] text-[11px] font-semibold uppercase tracking-widest shadow-[var(--app-shadow-card)] hover:bg-[var(--app-accent-hover)] transition-colors"
        >
          + Add Block
        </button>
      </div>

      ${showEditor && html`
        <div className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
          <h3 className="text-xl font-semibold text-[var(--app-text-primary)] mb-6">${editingBlock ? 'Edit' : 'Create'} Timetable Block</h3>
          <${TimetableBlockEditor}
            block=${editingBlock}
            onSave=${handleSave}
            onCancel=${() => { setShowEditor(false); setEditingBlock(null); }}
          />
        </div>
      `}

      ${companySlots.length > 0 ? html`
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8">
          <h4 className="text-sm font-semibold text-emerald-800 uppercase tracking-widest mb-4">Company Slots — You're In Process</h4>
          <p className="text-xs text-emerald-700 mb-4">Interview and presentation slots from companies you've applied to.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${companySlots.map(s => html`
              <div key=${s.id} className="p-4 bg-[var(--app-surface)] rounded-xl border border-emerald-100 flex items-center gap-3">
                <div className=${`px-2 py-1 rounded-lg text-[10px] font-semibold uppercase ${blockTypes[s.slot_type] || 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]'}`}>${s.slot_type}</div>
                <div>
                  <p className="text-sm font-bold text-[var(--app-text-primary)]">${s.start_time ? new Date(s.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                  <p className="text-[10px] text-[var(--app-text-secondary)]">Company slot</p>
                </div>
              </div>
            `)}
          </div>
        </div>
      ` : null}

      <div className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]" data-tour-id="calendar-grid">
        <h4 className="text-sm font-semibold text-[var(--app-text-secondary)] uppercase tracking-widest mb-4">Your Timetable Blocks</h4>
        <div className="space-y-4">
          ${days.map((day, dayIdx) => {
            const dayBlocks = blocks.filter(b => b.day_of_week === dayIdx);
            return html`
              <div key=${dayIdx} className="border-b border-[var(--app-border-soft)] pb-4 last:border-0">
                <h4 className="text-sm font-semibold text-[var(--app-text-primary)] mb-3">${day}</h4>
                ${dayBlocks.length === 0 ? html`
                  <p className="text-xs text-[var(--app-text-muted)] italic">No blocks scheduled</p>
                ` : html`
                  <div className="space-y-2">
                    ${dayBlocks.map(block => html`
                      <div key=${block.id} className="flex items-center justify-between p-3 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-sm)]">
                        <div className="flex items-center gap-3">
                          <div className=${`px-3 py-1 rounded-lg text-[10px] font-semibold uppercase ${blockTypes[block.block_type] || 'bg-[var(--app-bg-elevated)] text-[var(--app-text-primary)]'}`}>
                            ${block.block_type}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[var(--app-text-primary)]">
                              ${block.start_time} - ${block.end_time}
                            </p>
                            ${block.recurring && html`
                              <p className="text-[10px] text-[var(--app-text-muted)]">Recurring</p>
                            `}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick=${() => { setEditingBlock(block); setShowEditor(true); }}
                            className="p-2 text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button
                            onClick=${() => handleDelete(block.id)}
                            className="p-2 text-[var(--app-danger)] hover:bg-[rgba(220,38,38,0.08)] rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    `)}
                  </div>
                `}
              </div>
            `;
          })}
        </div>
      </div>
    </div>
  `;
};

export default StudentCalendarView;
