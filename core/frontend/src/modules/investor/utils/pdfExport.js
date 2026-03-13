import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export pitch deck slides to PDF.
 * @param {Object} options
 * @param {HTMLElement} options.container - DOM element containing .pdf-page-break divs
 * @param {Array<{id: string, Component: Function}>} options.slides - Slide definitions with id and Component
 * @param {Array<{url: string, x: number, y: number, w: number, h: number}>} [options.founderLinks] - Optional clickable link regions for founder slide (mm coords)
 * @param {string} [options.filename='ithras-deck.pdf'] - Output filename
 */
export async function exportDeckToPdf({ container, founderLinks, filename = 'ithras-deck.pdf', backgroundColor = '#1e2232' }) {
  const pages = container?.querySelectorAll('.pdf-page-break');
  if (!pages?.length) {
    throw new Error('No PDF pages found');
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgW = canvas.width;
    const imgH = canvas.height;
    const pageRatio = pageW / pageH;
    const imgRatio = imgW / imgH;
    let drawW = pageW;
    let drawH = pageH;
    let drawX = 0;
    let drawY = 0;
    if (imgRatio > pageRatio) {
      drawH = pageW / imgRatio;
      drawY = (pageH - drawH) / 2;
    } else {
      drawW = pageH * imgRatio;
      drawX = (pageW - drawW) / 2;
    }
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', drawX, drawY, drawW, drawH);

    const linksForPage = founderLinks?.[i];
    if (linksForPage?.length) {
      linksForPage.forEach((l) => {
        try {
          if (typeof pdf.link === 'function') {
            pdf.link(l.x, l.y, l.w, l.h, { url: l.url });
          }
        } catch (e) {
          console.warn('PDF link failed:', e);
        }
      });
    }
  }

  pdf.save(filename);
}
