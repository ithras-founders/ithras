import React, { useState, useEffect, useCallback, useRef } from 'react';
import htm from 'htm';
import SlideDeckContainer from './SlideDeckContainer.js';
import { exportDeckToPdf } from './utils/pdfExport.js';
import {
  CoverSlide,
  ProblemSlide1,
  ProblemSlide2,
  FoundersSlide,
  VisionSlide,
  CampusSlide,
  MarketSlide,
  HowSlide,
  AskSlide,
} from './slides/investorSlides.js';

const html = htm.bind(React.createElement);

const SLIDES = [
  { id: 'cover', label: 'Cover', Component: CoverSlide },
  { id: 'problem-1', label: 'Problem', Component: ProblemSlide1 },
  { id: 'problem-2', label: 'Incumbents Failing', Component: ProblemSlide2 },
  { id: 'founders', label: 'Founders', Component: FoundersSlide },
  { id: 'vision', label: 'Vision', Component: VisionSlide },
  { id: 'campus', label: 'Campus Wedge', Component: CampusSlide },
  { id: 'market', label: 'Market Sizing', Component: MarketSlide },
  { id: 'how', label: 'How', Component: HowSlide },
  { id: 'ask', label: 'The Ask', Component: AskSlide },
];

const FOUNDER_LINKS_BY_INDEX = {
  3: [
    { url: 'https://www.linkedin.com/in/shashankgandham/', x: 25, y: 115, w: 75, h: 8 },
    { url: 'https://www.linkedin.com/in/abhishek-achanta/', x: 125, y: 115, w: 75, h: 8 },
    { url: 'https://www.linkedin.com/in/matthew-kallarackal-939871124/', x: 225, y: 115, w: 75, h: 8 },
  ],
};

const InvestorPitchDeck = ({ onExit }) => {
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
      filename: 'ithras-investor-deck.pdf',
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
      className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-semibold transition-colors disabled:opacity-50"
    >
      ${exporting ? 'Exporting…' : 'Export PDF'}
    </button>
    <button
      onClick=${onExit}
      className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]"
    >
      <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;

  return html`
    <div>
      <${SlideDeckContainer}
        slides=${SLIDES}
        onExit=${onExit}
        deckLabel=${html`<span className="text-sm font-medium text-white/50 hidden sm:inline"><span className="text-[0.75em] align-top">I</span>thras | Investor Deck</span>`}
        topBarRight=${topBarRight}
      />
      ${exporting ? html`
        <div
          ref=${pdfRef}
          className="fixed bg-[#1e2232]"
          style=${{ left: '-9999px', top: 0, width: '297mm', background: 'linear-gradient(165deg, #1e2232 0%, #171b28 50%, #131722 100%)' }}
        >
          ${SLIDES.map((s) => html`
            <div key=${s.id} className="pdf-page-break" style=${{ width: '1122px', height: '794px', padding: '28px 32px 36px', boxSizing: 'border-box' }}>
              <${s.Component} />
            </div>
          `)}
        </div>
      ` : null}
    </div>
  `;
};

export default InvestorPitchDeck;
