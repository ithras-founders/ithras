import React, { useState } from 'react';
import htm from 'htm';
import { downloadCVsBulk } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const CVDownloadButton = ({ workflowId, jobId }) => {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await downloadCVsBulk(workflowId, jobId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cvs_${workflowId || jobId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download CVs: ' + (error.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  return html`
    <button
      onClick=${handleDownload}
      disabled=${downloading}
      className="px-6 py-3 bg-[var(--app-success)] text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      ${downloading ? 'Downloading...' : 'Download All CVs'}
    </button>
  `;
};

export default CVDownloadButton;
