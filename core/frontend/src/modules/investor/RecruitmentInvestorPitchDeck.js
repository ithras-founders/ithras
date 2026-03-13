import React, { useState, useEffect, useCallback, useRef } from 'react';
import htm from 'htm';
import SlideDeckContainer from './SlideDeckContainer.js';
import { exportDeckToPdf } from './utils/pdfExport.js';
import {
  CoverSlide,
  HRProblemsSlide,
  CandidateProblemsSlide,
  ProblemSummarySlide,
  CompetitorProblemsSlide,
  UnifiedPillarsSlide,
  UniversityInsightSlide,
  SolutionSlide,
  AISlide,
  DataMoatSlide,
  GTMSlide,
  BusinessModelSlide,
  MarketSlide,
  CompetitiveLandscapeSlide,
  FoundersSlide,
  CloseSlide,
} from './slides/recruitmentInvestorSlides.js';

const html = htm.bind(React.createElement);

const SLIDES = [
  { id: 'cover', label: 'Cover', Component: CoverSlide },
  { id: 'hr-problems', label: '50+ HR Problems', Component: HRProblemsSlide },
  { id: 'candidate-problems', label: '100+ Candidate Problems', Component: CandidateProblemsSlide },
  { id: 'problem-summary', label: '7 + 7 Problem Summary', Component: ProblemSummarySlide },
  { id: 'competitor-problems', label: '12+ Competitors', Component: CompetitorProblemsSlide },
  { id: 'unified-pillars', label: 'Five Pillars', Component: UnifiedPillarsSlide },
  { id: 'solution', label: 'Our Solution', Component: SolutionSlide },
  { id: 'university-insight', label: 'University Effect', Component: UniversityInsightSlide },
  { id: 'ai', label: 'AI Everywhere', Component: AISlide },
  { id: 'data-moat', label: 'Data Moat', Component: DataMoatSlide },
  { id: 'gtm', label: 'GTM Strategy', Component: GTMSlide },
  { id: 'business-model', label: 'Business Model', Component: BusinessModelSlide },
  { id: 'market', label: 'Market Size', Component: MarketSlide },
  { id: 'competitive', label: 'Competitive Landscape', Component: CompetitiveLandscapeSlide },
  { id: 'founders', label: 'Founders', Component: FoundersSlide },
  { id: 'close', label: 'Close', Component: CloseSlide },
];

const FOUNDER_LINKS_BY_INDEX = {
  14: [
    { url: 'https://www.linkedin.com/in/shashankgandham/', x: 25, y: 115, w: 75, h: 8 },
    { url: 'https://www.linkedin.com/in/abhishek-achanta/', x: 125, y: 115, w: 75, h: 8 },
    { url: 'https://www.linkedin.com/in/matthew-kallarackal-939871124/', x: 225, y: 115, w: 75, h: 8 },
  ],
};

const LIGHT_BG = '#f8f9fc';

const RecruitmentInvestorPitchDeck = ({ onExit }) => {
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
      filename: 'ithras-recruitment-investor-deck.pdf',
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
      ${exporting ? 'Exporting\u2026' : 'Export PDF'}
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
        deckLabel=${html`<span className="text-sm font-medium text-slate-500 hidden sm:inline"><span className="text-[0.75em] align-top">I</span>thras | Recruitment Investor Deck</span>`}
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

export default RecruitmentInvestorPitchDeck;
