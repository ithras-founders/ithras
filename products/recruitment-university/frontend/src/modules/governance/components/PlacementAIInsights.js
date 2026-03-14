import React, { useState, useEffect } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const PlacementAIInsights = () => {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "You are the Ithras AI engine for the placement portal. Provide a 2-sentence highly strategic recommendation for the Placement Team regarding Slot 2 transition, focusing on role diversity and compensation benchmarks.",
      });
      setInsight(response.text || "Ithras is analyzing current data streams...");
    } catch (err) {
      console.error('Ithras Intelligence Error:', err);
      setInsight("Unable to connect to Intelligence Node. Verify connectivity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (process.env.API_KEY) fetchInsights();
  }, []);

  return html`
    <div className="bg-[var(--app-text-primary)] rounded-[var(--app-radius-md)] p-8 text-white shadow-[var(--app-shadow-floating)] relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-[var(--app-accent)] blur-[80px] rounded-full"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <svg className="w-6 h-6 text-[var(--app-accent)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight leading-none">Ithras Intelligence</h3>
            <p className="text-[10px] font-semibold text-[var(--app-accent)] uppercase tracking-widest mt-1">Strategic Engine 3.0</p>
          </div>
        </div>
        
        <div className="min-h-[80px] flex items-center">
          ${loading ? html`
            <div className="animate-pulse space-y-3 w-full">
              <div className="h-2.5 bg-white/10 rounded-full w-full"></div>
              <div className="h-2.5 bg-white/10 rounded-full w-2/3"></div>
            </div>
          ` : html`
            <p className="text-[var(--app-text-muted)] text-sm font-medium leading-relaxed italic opacity-90 border-l-2 border-[var(--app-accent)]/50 pl-4">
              "${insight}"
            </p>
          `}
        </div>
        
        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-[var(--app-accent)] animate-bounce"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-[var(--app-accent)] animate-bounce delay-75"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-[var(--app-accent)] animate-bounce delay-150"></div>
          </div>
          <button 
            onClick=${fetchInsights}
            disabled=${loading}
            className="text-[10px] font-semibold text-[var(--app-text-muted)] hover:text-white uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            ${loading ? 'Analyzing...' : 'Refresh Strategy'}
          </button>
        </div>
      </div>
    </div>
  `;
};

export default PlacementAIInsights;
