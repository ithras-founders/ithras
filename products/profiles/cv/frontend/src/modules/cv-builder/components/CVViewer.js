import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getCVs, verifyCV, getUsers } from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const CVViewer = ({ user }) => {
  const toast = useToast();
  const [cvs, setCVs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCV, setSelectedCV] = useState(null);
  const [rejectingCV, setRejectingCV] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [filterInstitution, setFilterInstitution] = useState(user.institution_id || '');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, [filterInstitution, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterInstitution) filters.institution_id = filterInstitution;
      if (filterStatus) filters.status = filterStatus;
      
      const [cvsData, usersRes] = await Promise.all([
        getCVs(filters),
        getUsers({ role: UserRole.CANDIDATE, limit: 500 })
      ]);
      
      setCVs(cvsData);
      setStudents(usersRes?.items ?? []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (cvId, status, notes) => {
    try {
      await verifyCV(cvId, {
        status,
        verified_by: user.id,
        notes
      });
      toast.success(`CV ${status.toLowerCase()} successfully!`);
      fetchData();
      setSelectedCV(null);
    } catch (error) {
      toast.error('Failed to verify CV: ' + (error.message || 'Unknown error'));
    }
  };

  const getStudentName = (candidateId) => {
    const student = students.find(s => s.id === candidateId);
    return student ? student.name : 'Unknown';
  };

  if (loading) {
    return html`<div className="p-20 text-center font-black text-slate-200 text-3xl italic">Loading...</div>`;
  }

  return html`
    <div className="space-y-10 animate-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">CV Verification</h2>
          <p className="text-slate-500 font-medium italic mt-2">Review and verify student CVs</p>
        </div>
      </header>

      <!-- Filters -->
      <div className="bg-white p-6 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Status
            </label>
            <select
              value=${filterStatus}
              onChange=${e => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <!-- CV List -->
      <div className="space-y-4">
        ${cvs.length === 0 ? html`
          <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm">
            <p className="text-center text-slate-400 py-10">No CVs found matching the filters.</p>
          </div>
        ` : cvs.map(cv => html`
          <div key=${cv.id} className="bg-white p-6 rounded-[40px] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-xl font-black text-slate-900">${getStudentName(cv.candidate_id)}</h4>
                <div className="flex gap-4 mt-2">
                  <span className=${`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                    cv.status === 'VERIFIED' ? 'bg-green-100 text-green-600' :
                    cv.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                    cv.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    ${cv.status}
                  </span>
                  ${(cv.verified_by_name || cv.verified_by) && html`
                    <span className="text-sm text-slate-500">Verified by: ${cv.verified_by_name || cv.verified_by}</span>
                  `}
                </div>
                ${cv.verification_notes && html`
                  <p className="text-sm text-slate-600 mt-2 italic">${cv.verification_notes}</p>
                `}
              </div>
              <div className="flex gap-3">
                <button
                  onClick=${() => setSelectedCV(cv)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-100 transition-colors"
                >
                  View CV
                </button>
                ${cv.status !== 'VERIFIED' && cv.status !== 'REJECTED' && html`
                  <button
                    onClick=${() => handleVerify(cv.id, 'VERIFIED', '')}
                    className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase hover:bg-green-100 transition-colors"
                  >
                    Verify
                  </button>
                  <button
                    onClick=${() => setRejectingCV(cv)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                `}
              </div>
            </div>
          </div>
        `)}
      </div>

      <!-- CV Detail Modal -->
      ${selectedCV && html`
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900">${getStudentName(selectedCV.candidate_id)} - CV</h3>
              <button
                onClick=${() => setSelectedCV(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              ${selectedCV.data && html`
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 mb-2">${selectedCV.data.name || 'N/A'}</h4>
                    <p className="text-sm text-slate-600">${selectedCV.data.email || ''}</p>
                    <p className="text-sm text-slate-600">${selectedCV.data.roll || ''}</p>
                  </div>
                  ${selectedCV.data.highlights && selectedCV.data.highlights.length > 0 && html`
                    <div>
                      <h5 className="text-sm font-bold text-slate-700 mb-2">Highlights</h5>
                      <p className="text-sm text-blue-600 font-bold">${selectedCV.data.highlights.join(' | ')}</p>
                    </div>
                  `}
                  ${selectedCV.data.sections && selectedCV.data.sections.map((section, idx) => html`
                    <div key=${idx} className="border-t border-slate-200 pt-4">
                      <h5 className="text-lg font-black text-slate-900 mb-3">${section.title}</h5>
                      ${section.items && section.items.map((item, iIdx) => html`
                        <div key=${iIdx} className="mb-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-slate-900">${item.company || ''}</p>
                              <p className="text-sm text-slate-600">${item.role || ''}</p>
                            </div>
                            <span className="text-sm text-slate-500">${item.period || ''}</span>
                          </div>
                          ${item.bullets && item.bullets.length > 0 && html`
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              ${item.bullets.map((bullet, bIdx) => html`
                                <li key=${bIdx} className="text-sm text-slate-700">${bullet}</li>
                              `)}
                            </ul>
                          `}
                        </div>
                      `)}
                    </div>
                  `)}
                </div>
              `}
              ${selectedCV.status !== 'VERIFIED' && selectedCV.status !== 'REJECTED' && html`
                <div className="mt-6 pt-6 border-t border-slate-200 flex gap-3">
                  <button
                    onClick=${() => handleVerify(selectedCV.id, 'VERIFIED', '')}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-green-700 transition-colors"
                  >
                    Verify CV
                  </button>
                  <button
                    onClick=${() => setRejectingCV(selectedCV)}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-700 transition-colors"
                  >
                    Reject CV
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>
      `}

      <!-- Rejection Modal -->
      ${rejectingCV && html`
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] max-w-md w-full p-6">
            <h3 className="text-xl font-black text-slate-900 mb-2">Reject CV</h3>
            <p className="text-sm text-slate-600 mb-4">Please provide a reason for rejection. This will be shared with the student.</p>
            <textarea
              value=${rejectNotes}
              onChange=${e => setRejectNotes(e.target.value)}
              placeholder="e.g., Missing required sections, incorrect dates..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 mb-4 min-h-[100px]"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick=${() => {
                  setRejectingCV(null);
                  setRejectNotes('');
                }}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick=${async () => {
                  await handleVerify(rejectingCV.id, 'REJECTED', rejectNotes);
                  setRejectingCV(null);
                  setRejectNotes('');
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
};

export default CVViewer;
