import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getCVTemplates, getCVs, createCV, updateCV } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import ResumePreview from '../components/ResumePreview.js';

const html = htm.bind(React.createElement);

const CVBuilder = ({ user }) => {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [existingCV, setExistingCV] = useState(null);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [resumeData, setResumeData] = useState({
    name: user.name.toUpperCase(),
    roll: '',
    email: user.email,
    highlights: [],
    academics: [],
    sections: []
  });

  useEffect(() => {
    fetchTemplates();
    fetchExistingCV();
  }, [user.institution_id]);

  const fetchTemplates = async () => {
    try {
      const response = await getCVTemplates(user.institution_id, null, { limit: 100 });
      const items = Array.isArray(response) ? response : (response?.items ?? []);
      const templatesData = items.filter(t => t.is_active);
      setTemplates(templatesData);
      if (templatesData.length > 0) {
        setSelectedTemplate(templatesData.find(t => t.is_active) || templatesData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingCV = async () => {
    try {
      const cvs = await getCVs({ candidate_id: user.id });
      if (cvs.length > 0) {
        const cv = cvs[0];
        setExistingCV(cv);
        if (cv.data) {
          setResumeData(cv.data);
        }
        if (cv.template_id) {
          const template = templates.find(t => t.id === cv.template_id);
          if (template) setSelectedTemplate(template);
        }
      }
    } catch (error) {
      console.error('Failed to fetch CV:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    setSaving(true);
    try {
      const cvData = {
        candidate_id: user.id,
        template_id: selectedTemplate.id,
        data: resumeData,
        status: existingCV ? existingCV.status : 'DRAFT'
      };

      if (existingCV) {
        await updateCV(existingCV.id, cvData);
      } else {
        await createCV(cvData);
      }
      toast.success('CV saved successfully!');
      fetchExistingCV();
    } catch (error) {
      toast.error('Failed to save CV: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    const newData = { ...resumeData };
    newData.sections.push({
      title: 'New Section',
      items: []
    });
    setResumeData(newData);
  };

  const addItem = (sectionIndex) => {
    const newData = { ...resumeData };
    if (!newData.sections[sectionIndex].items) {
      newData.sections[sectionIndex].items = [];
    }
    newData.sections[sectionIndex].items.push({
      company: '',
      role: '',
      period: '',
      bullets: ['']
    });
    setResumeData(newData);
  };

  const addBullet = (sIdx, iIdx) => {
    const newData = { ...resumeData };
    newData.sections[sIdx].items[iIdx].bullets.push('');
    setResumeData(newData);
  };

  const updateField = (path, value) => {
    const newData = { ...resumeData };
    const keys = path.split('.');
    let current = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setResumeData(newData);
  };

  if (loading) {
    return html`<div className="p-20 text-center font-black text-slate-200 text-3xl italic">Loading...</div>`;
  }

  if (templates.length === 0) {
    return html`
      <div className="p-20 text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-4">No CV Template Available</h2>
        <p className="text-slate-500">Your institution hasn't set up a CV template yet. Please contact your placement team.</p>
      </div>
    `;
  }

  return html`
    <div className="max-w-[1600px] mx-auto min-h-[calc(100vh-120px)] relative">
      <div className=${`flex flex-col lg:flex-row gap-8 ${showPreviewMobile ? 'hidden lg:flex' : 'flex'}`}>
        <div className="flex-1 space-y-6 pb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">CV Builder</h2>
              ${selectedTemplate && html`
                <p className="text-sm text-slate-500 mt-1">Template: ${selectedTemplate.name}</p>
              `}
            </div>
            <div className="flex gap-2">
              <button 
                onClick=${handleSave}
                disabled=${saving}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold shadow-lg shadow-blue-500/20 uppercase tracking-widest disabled:opacity-50"
              >
                ${saving ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick=${() => setShowPreviewMobile(true)} 
                className="lg:hidden flex-1 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
              >
                Preview
              </button>
            </div>
          </div>

          <!-- Header Section -->
          <div className="bg-white rounded-2xl md:rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800">1. Header & Highlights</h3>
            </div>
            <div className="p-5 md:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <input 
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs md:text-sm font-medium" 
                  value=${resumeData.name}
                  onChange=${e => updateField('name', e.target.value)}
                  placeholder="Full Name"
                />
                <input 
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs md:text-sm font-medium" 
                  value=${resumeData.roll || ''}
                  onChange=${e => updateField('roll', e.target.value)}
                  placeholder="Roll Number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Banner Highlights</label>
                <input 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-blue-600" 
                  value=${resumeData.highlights.join(' | ')}
                  onChange=${e => updateField('highlights', e.target.value.split('|').map(s => s.trim()).filter(s => s))}
                  placeholder="Highlight 1 | Highlight 2 | Highlight 3"
                />
              </div>
            </div>
          </div>

          <!-- Sections -->
          ${resumeData.sections.map((section, sIdx) => html`
            <div key=${sIdx} className="bg-white rounded-2xl md:rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <input
                  className="text-sm font-extrabold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                  value=${section.title}
                  onChange=${e => {
                    const newData = { ...resumeData };
                    newData.sections[sIdx].title = e.target.value;
                    setResumeData(newData);
                  }}
                />
                <button 
                  onClick=${() => addItem(sIdx)}
                  className="text-blue-600 text-[10px] font-bold uppercase tracking-widest"
                >
                  + Add Item
                </button>
              </div>
              <div className="p-5 md:p-6 space-y-8">
                ${section.items && section.items.map((item, iIdx) => html`
                  <div key=${iIdx} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                      <input 
                        placeholder="Company" 
                        className="p-3 border border-slate-200 rounded-xl text-xs md:text-sm font-bold" 
                        value=${item.company || ''}
                        onChange=${e => {
                          const newData = { ...resumeData };
                          newData.sections[sIdx].items[iIdx].company = e.target.value;
                          setResumeData(newData);
                        }}
                      />
                      <input 
                        placeholder="Role" 
                        className="p-3 border border-slate-200 rounded-xl text-xs md:text-sm font-bold" 
                        value=${item.role || ''}
                        onChange=${e => {
                          const newData = { ...resumeData };
                          newData.sections[sIdx].items[iIdx].role = e.target.value;
                          setResumeData(newData);
                        }}
                      />
                      <input 
                        placeholder="Period" 
                        className="p-3 border border-slate-200 rounded-xl text-xs md:text-sm font-bold" 
                        value=${item.period || ''}
                        onChange=${e => {
                          const newData = { ...resumeData };
                          newData.sections[sIdx].items[iIdx].period = e.target.value;
                          setResumeData(newData);
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      ${item.bullets && item.bullets.map((bullet, bIdx) => html`
                        <div key=${bIdx} className="flex gap-2 group">
                          <div className="flex-1 relative">
                            <input 
                              className=${`w-full p-3 pr-16 bg-slate-50 border border-slate-100 rounded-xl text-xs md:text-sm font-medium transition-all focus:bg-white focus:border-blue-300 ${bullet.length > 90 ? 'border-red-300' : ''}`}
                              value=${bullet}
                              onChange=${e => {
                                const newData = {...resumeData};
                                newData.sections[sIdx].items[iIdx].bullets[bIdx] = e.target.value;
                                setResumeData(newData);
                              }}
                            />
                            <span className=${`absolute right-3 top-3.5 text-[8px] font-bold ${bullet.length > 90 ? 'text-red-500' : 'text-slate-400'}`}>
                              ${bullet.length}/90
                            </span>
                          </div>
                        </div>
                      `)}
                      <button 
                        onClick=${() => addBullet(sIdx, iIdx)} 
                        className="text-[9px] font-bold text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest"
                      >
                        + Achievement Line
                      </button>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          `)}

          <button 
            onClick=${addSection}
            className="w-full p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            + Add Section
          </button>
        </div>

        <!-- Preview Panel -->
        <div className="hidden lg:block w-[480px] xl:w-[600px] shrink-0 sticky top-10 h-fit">
          <div className="bg-slate-900/5 p-4 rounded-[40px] border border-slate-200">
            <div className="flex items-center justify-between mb-4 px-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Preview</span>
              <button 
                onClick=${() => window.print()} 
                className="flex items-center gap-2 text-blue-600 font-bold text-[10px] bg-white px-4 py-2 rounded-full shadow-sm uppercase tracking-widest"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Download PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[550px] transform scale-[0.85] origin-top">
                <${ResumePreview} data=${resumeData} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Preview -->
      ${showPreviewMobile && html`
        <div className="lg:hidden fixed inset-0 bg-slate-100 z-[70] flex flex-col p-4 animate-in">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <button 
              onClick=${() => setShowPreviewMobile(false)} 
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back to Editor
            </button>
            <button 
              onClick=${() => window.print()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              Download
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-slate-200/50 rounded-2xl p-4">
            <div className="min-w-[600px] origin-top-left transform scale-[0.6]">
              <${ResumePreview} data=${resumeData} />
            </div>
          </div>
        </div>
      `}
    </div>
  `;
};

export default CVBuilder;
