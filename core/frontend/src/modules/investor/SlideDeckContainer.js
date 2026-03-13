import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TRANSITION_MS = 500;

const THEMES = {
  dark: {
    bg: 'linear-gradient(165deg, #1e2232 0%, #171b28 50%, #131722 100%)',
    color: '#f4f4f5',
    topBar: 'bg-[#171b28]/80 backdrop-blur-xl border-b border-white/[0.06]',
    labelColor: 'text-white/50',
    counterColor: 'text-white/30',
    btnBg: 'bg-white/5 hover:bg-white/10',
    btnBorder: 'border border-white/10',
    iconColor: 'text-white/70',
    closeIconColor: 'text-white/50',
    bottomBar: 'bg-[#171b28]/60 backdrop-blur-sm border-t border-white/[0.06]',
    progressTrack: 'bg-white/[0.08]',
    dotActive: 'bg-indigo-400',
    dotPast: 'bg-white/25',
    dotFuture: 'bg-white/10',
  },
  light: {
    bg: 'linear-gradient(165deg, #f8f9fc 0%, #f0f2f7 50%, #e8ecf4 100%)',
    color: '#1e293b',
    topBar: 'bg-white/80 backdrop-blur-xl border-b border-slate-200/60',
    labelColor: 'text-slate-500',
    counterColor: 'text-slate-400',
    btnBg: 'bg-slate-900/5 hover:bg-slate-900/10',
    btnBorder: 'border border-slate-200',
    iconColor: 'text-slate-500',
    closeIconColor: 'text-slate-400',
    bottomBar: 'bg-white/60 backdrop-blur-sm border-t border-slate-200/60',
    progressTrack: 'bg-slate-200',
    dotActive: 'bg-indigo-500',
    dotPast: 'bg-slate-400',
    dotFuture: 'bg-slate-200',
  },
};

/**
 * Shared slide deck navigation shell.
 * @param {Object} props
 * @param {Array<{id: string, label: string, Component: Function}>} props.slides
 * @param {Function} [props.onExit]
 * @param {React.ReactNode} [props.topBarLeft]
 * @param {React.ReactNode} [props.topBarRight]
 * @param {string} [props.deckLabel]
 * @param {'dark'|'light'} [props.theme='dark']
 */
const SlideDeckContainer = ({
  slides,
  onExit,
  topBarLeft,
  topBarRight,
  deckLabel,
  theme: themeName = 'dark',
}) => {
  const t = THEMES[themeName] || THEMES.dark;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [navAlwaysVisible, setNavAlwaysVisible] = useState(false);

  useEffect(() => {
    setNavAlwaysVisible(typeof window !== 'undefined' && ('ontouchstart' in window || window.matchMedia('(max-width: 768px)').matches));
  }, []);

  const navVisible = showNav || navAlwaysVisible;

  const goTo = useCallback((idx) => {
    if (idx < 0 || idx >= slides.length || idx === currentSlide || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(idx);
      setTimeout(() => setTransitioning(false), 50);
    }, TRANSITION_MS / 2);
  }, [currentSlide, transitioning, slides.length]);

  const next = useCallback(() => goTo(currentSlide + 1), [goTo, currentSlide]);
  const prev = useCallback(() => goTo(currentSlide - 1), [goTo, currentSlide]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Escape') {
        onExit?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, prev, onExit]);

  const SlideComponent = slides[currentSlide]?.Component;

  return html`
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style=${{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: t.bg, color: t.color }}
      onMouseMove=${() => { if (!showNav) setShowNav(true); }}
    >
      <div
        className=${'absolute inset-0 transition-all duration-500 ease-out ' + (transitioning ? 'opacity-0 scale-[0.97]' : 'opacity-100 scale-100')}
        style=${{ willChange: 'opacity, transform' }}
      >
        <${SlideComponent} />
      </div>

      <div className=${'fixed top-0 left-0 right-0 z-50 transition-opacity duration-300 ' + (navVisible ? 'opacity-100' : 'opacity-0')}>
        <div className=${'flex items-center justify-between px-5 md:px-8 py-4 ' + t.topBar}>
          <div className="flex items-center gap-3">
            ${topBarLeft || (deckLabel ? html`<span className=${'text-sm font-medium hidden sm:inline ' + t.labelColor}>${deckLabel}</span>` : null)}
          </div>
          <div className="flex items-center gap-4">
            <span className=${'text-xs font-mono ' + t.counterColor}>${currentSlide + 1} / ${slides.length}</span>
            ${topBarRight || (onExit ? html`
              <button
                onClick=${onExit}
                className=${'w-10 h-10 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-colors min-w-[44px] min-h-[44px] ' + t.btnBg}
              >
                <svg className=${'w-4 h-4 ' + t.closeIconColor} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ` : null)}
          </div>
        </div>
      </div>

      ${currentSlide > 0 ? html`
        <button
          onClick=${prev}
          className=${'fixed left-2 md:left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center transition-all ' + t.btnBg + ' ' + t.btnBorder + ' ' + (navVisible ? 'opacity-100' : 'opacity-0')}
        >
          <svg className=${'w-5 h-5 ' + t.iconColor} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
      ` : null}
      ${currentSlide < slides.length - 1 ? html`
        <button
          onClick=${next}
          className=${'fixed right-2 md:right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center transition-all ' + t.btnBg + ' ' + t.btnBorder + ' ' + (navVisible ? 'opacity-100' : 'opacity-0')}
        >
          <svg className=${'w-5 h-5 ' + t.iconColor} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      ` : null}

      <div className=${'fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] ' + t.bottomBar}>
        <div className=${'h-0.5 ' + t.progressTrack}>
          <div
            className="h-full bg-indigo-500/80 transition-all duration-500 ease-out rounded-r-full"
            style=${{ width: ((currentSlide + 1) / slides.length * 100) + '%' }}
          />
        </div>
        <div className=${'flex items-center justify-center gap-1.5 py-3 transition-opacity duration-300 overflow-x-auto overflow-y-hidden ' + (navVisible ? 'opacity-100' : 'opacity-0')}>
          <div className="flex items-center justify-center gap-1.5 flex-nowrap px-2">
            ${slides.map((s, i) => html`
              <button
                key=${s.id}
                onClick=${() => goTo(i)}
                className=${'w-2 h-2 min-w-[8px] rounded-full transition-all shrink-0 ' + (i === currentSlide ? t.dotActive + ' w-5' : i < currentSlide ? t.dotPast : t.dotFuture)}
                title=${s.label}
              />
            `)}
          </div>
        </div>
      </div>
    </div>
  `;
};

export default SlideDeckContainer;
export { TRANSITION_MS };
