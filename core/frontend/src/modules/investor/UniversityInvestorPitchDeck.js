import React, { useState, useEffect, useCallback, useRef } from 'react';
import htm from 'htm';
import SlideDeckContainer from './SlideDeckContainer.js';
import { exportDeckToPdf } from './utils/pdfExport.js';
import {
  CoverSlide,
  CampusCrisisSlide,
  HowWeSolveSlide,
  WhyUsSlide,
  VisionFlywheelSlide,
  IncumbentsFailingSlide,
  MarketSizeSlide,
  FoundersSlide,
  CloseSlide,
} from './slides/universityInvestorSlides.js';

const html = htm.bind(React.createElement);

const SLIDES = [
  { id: 'cover', label: 'Cover', Component: CoverSlide },
  { id: 'crisis', label: 'Campus Crisis', Component: CampusCrisisSlide },
  { id: 'solution', label: 'How We Solve It', Component: HowWeSolveSlide },
  { id: 'why-us', label: 'Why Us?', Component: WhyUsSlide },
  { id: 'vision', label: 'Vision', Component: VisionFlywheelSlide },
  { id: 'incumbents', label: 'Incumbents Failing', Component: IncumbentsFailingSlide },
  { id: 'market', label: 'Market Size', Component: MarketSizeSlide },
  { id: 'founders', label: 'Founders', Component: FoundersSlide },
  { id: 'close', label: 'Close', Component: CloseSlide },
];

const FOUNDER_LINKS_BY_INDEX = {
  7: [
    { url: 'https://www.linkedin.com/in/shashankgandham/', x: 25, y: 115, w: 75, h: 8 },
    { url: 'https://www.linkedin.com/in/abhishek-achanta/', x: 125, y: 115, w: 75, h: 8 },
    { url: 'https://www.linkedin.com/in/matthew-kallarackal-939871124/', x: 225, y: 115, w: 75, h: 8 },
  ],
};

const LIGHT_BG = '#f8f9fc';

const UniversityInvestorPitchDeck = ({ onExit }) => {
  const [exporting, setExporting] = useState(false);
  const pdfRef = useRef(null);

  const handleExportPdf = useCallback(() => {
    if (exporting) return;
    setExporting(true);
  }, [exporting]);

  useEffect(() => {
    if (!exporting || !pdfRef.current) return;
    const container = pdfRef.current;
    const pages = container.querySelectorAll('.pdf-page-break');
    if (!pages.length) {
      setExporting(false);
      return;
    }

    const founderLinksByIndex = SLIDES.map((_, i) => FOUNDER_LINKS_BY_INDEX[i] || []);

    exportDeckToPdf({
      container,
      founderLinks: founderLinksByIndex,
      filename: 'ithras-university-investor-deck.pdf',
      backgroundColor: LIGHT_BG,
    })
      .then(() => setExporting(false))
      .catch((err) => {
        console.error('PDF export failed:', err);
        setExporting(false);
      });
  }, [exporting]);

  const topBarRight = html`
    <button
      onClick=${handleExportPdf}
      disabled=${exporting}
      className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 text-xs font-semibold transition-colors disabled:opacity-50"
    >
      ${exporting ? 'Exporting…' : 'Export PDF'}
    </button>
    <button
      onClick=${onExit}
      className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-slate-900/5 hover:bg-slate-900/10 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]"
    >
      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;

  return html`
    <div>
      <${SlideDeckContainer}
        slides=${SLIDES}
        onExit=${onExit}
        theme="light"
        deckLabel=${html`<span className="text-sm font-medium text-slate-500 hidden sm:inline"><span className="text-[0.75em] align-top">I</span>thras | University Investor Deck</span>`}
        topBarRight=${topBarRight}
      />
      ${exporting ? html`
        <div
          ref=${pdfRef}
          className="fixed"
          style=${{ left: '-9999px', top: 0, width: '297mm', background: 'linear-gradient(165deg, #f8f9fc 0%, #f0f2f7 50%, #e8ecf4 100%)' }}
        >
          ${SLIDES.map((s) => html`
            <div key=${s.id} className="pdf-page-break" style=${{ width: '1122px', height: '794px', padding: '28px 32px 36px', boxSizing: 'border-box', background: 'linear-gradient(165deg, #f8f9fc 0%, #f0f2f7 50%, #e8ecf4 100%)', color: '#1e293b' }}>
              <${s.Component} />
            </div>
          `)}
        </div>
      ` : null}
    </div>
  `;
};

export default UniversityInvestorPitchDeck;
