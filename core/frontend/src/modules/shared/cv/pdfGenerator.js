// PDF Generator using html2pdf.js
// Load via script tag; the library attaches to window.html2pdf (no ES default export when loaded from CDN)

const loadHtml2Pdf = () => {
  if (typeof window !== 'undefined' && window.html2pdf) return Promise.resolve(window.html2pdf);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    script.onload = () => resolve(window.html2pdf);
    script.onerror = () => reject(new Error('Failed to load html2pdf.js'));
    document.head.appendChild(script);
  });
};

export const exportToPDF = async (template, cvData, user, customFilename = null) => {
  try {
    const html2pdf = await loadHtml2Pdf();

    const config = template.config || {};
    const pageSize = config.page?.size === 'Letter' ? 'letter' : 'a4';
    const orientation = 'portrait';

    const previewElement = document.getElementById('cv-preview-content');
    if (!previewElement) {
      throw new Error('Preview element not found');
    }

    const opt = {
      margin: [0, 0, 0, 0],
      filename: customFilename && customFilename.trim()
        ? customFilename.replace(/\.pdf$/i, '') + '.pdf'
        : `CV_${(user.name || user.id || 'CV').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: {
        unit: 'mm',
        format: pageSize,
        orientation: orientation
      }
    };

    await html2pdf().set(opt).from(previewElement).save();
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
};

export const generatePDFBlob = async (template, user, customFilename = null) => {
  try {
    const html2pdf = await loadHtml2Pdf();

    const config = template?.config || {};
    const pageSize = config.page?.size === 'Letter' ? 'letter' : 'a4';
    const previewElement = document.getElementById('cv-preview-content');
    if (!previewElement) {
      throw new Error('Preview element not found');
    }

    const worker = html2pdf()
      .set({
        margin: [0, 0, 0, 0],
        filename: customFilename && customFilename.trim()
          ? customFilename.replace(/\.pdf$/i, '') + '.pdf'
          : `CV_${(user?.name || user?.id || 'CV').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: {
          unit: 'mm',
          format: pageSize,
          orientation: 'portrait',
        },
      })
      .from(previewElement)
      .toPdf();

    const pdfObj = await worker.get('pdf');
    const blob = pdfObj.output('blob');
    return blob;
  } catch (error) {
    console.error('PDF blob generation error:', error);
    throw error;
  }
};
