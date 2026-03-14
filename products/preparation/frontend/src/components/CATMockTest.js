/**
 * CAT Mock Test: timed test UI, question navigation, submit flow, results.
 */
import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { startCATMock, submitCATMock } from '/core/frontend/src/modules/shared/services/api/preparation.js';

const html = htm.bind(React.createElement);

const CATMockTest = ({ sessionId: propSessionId, sessionType: propSessionType, navigate, onBack }) => {
  const [sessionId, setSessionId] = useState(propSessionId);
  const [questions, setQuestions] = useState([]);
  const [timeLimitSec, setTimeLimitSec] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(!propSessionId);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const startMock = useCallback(async (sessionType) => {
    const type = sessionType || propSessionType || 'SECTIONAL_VARC';
    setLoading(true);
    setError(null);
    try {
      const data = await startCATMock({ session_type: type, difficulty_level: 'MIXED' });
      setSessionId(data.session_id);
      setQuestions(data.questions || []);
      setTimeLimitSec(data.time_limit_sec || 1800);
      setTimeLeft(data.time_limit_sec || 1800);
      setResponses({});
      setCurrentIdx(0);
      setResult(null);
    } catch (e) {
      setError(e?.message || 'Failed to start mock');
    } finally {
      setLoading(false);
    }
  }, [propSessionType]);

  useEffect(() => {
    if (propSessionId && !questions.length) {
      setError('Session loaded but questions missing. Please start a new mock.');
    } else if (!propSessionId && !sessionId && !loading && !result && propSessionType) {
      startMock(propSessionType);
    }
  }, [propSessionId, sessionId, questions.length, loading, result, startMock]);

  useEffect(() => {
    if (!timeLeft || result) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft, result]);

  const handleAnswer = (qId, value) => {
    setResponses((r) => ({ ...r, [qId]: { selected_option: value, time_spent_sec: 0 } }));
  };

  const handleSubmit = async () => {
    if (submitting || result) return;
    setSubmitting(true);
    const respList = questions.map((q) => ({
      question_id: q.id,
      selected_option: responses[q.id]?.selected_option ?? null,
      time_spent_sec: responses[q.id]?.time_spent_sec ?? 60,
    }));
    try {
      const res = await submitCATMock(sessionId, respList);
      setResult(res);
    } catch (e) {
      setError(e?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading && !questions.length) {
    return html`
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--app-accent)] border-t-transparent rounded-full" />
      </div>
    `;
  }

  if (error && !questions.length) {
    return html`
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <p className="text-amber-800 dark:text-amber-200">${error}</p>
        <button onClick=${() => startMock()} className="mt-2 px-3 py-1 bg-amber-600 text-white rounded text-sm">Retry</button>
        ${onBack ? html`<button onClick=${onBack} className="ml-2 mt-2 px-3 py-1 border rounded text-sm">Back</button>` : null}
      </div>
    `;
  }

  if (result) {
    return html`
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[var(--app-text-primary)]">Mock Results</h3>
        <div className="bg-[var(--app-surface)] rounded-xl border p-4">
          <p className="text-[var(--app-accent)] font-semibold">Total Raw Score: ${result.total_raw ?? 0}</p>
          <pre className="mt-2 text-sm overflow-auto">${JSON.stringify(result.score_raw || {}, null, 2)}</pre>
        </div>
        <div className="flex gap-2">
          <button onClick=${() => navigate?.('preparation/cat')} className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg">Dashboard</button>
          <button onClick=${() => { setResult(null); setSessionId(null); startMock(); }} className="px-4 py-2 border rounded-lg">Take Another</button>
        </div>
      </div>
    `;
  }

  if (!questions.length) return null;

  const q = questions[currentIdx];
  if (!q) return null;

  return html`
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between py-2 border-b border-[var(--app-border-soft)]">
        <div className="flex gap-2">
          <span className="font-mono font-bold ${timeLeft < 300 ? 'text-red-600' : ''}">${fmt(timeLeft)}</span>
          <span className="text-[var(--app-text-muted)]">|</span>
          <span>Q ${currentIdx + 1} of ${questions.length}</span>
        </div>
        <button onClick=${handleSubmit} disabled=${submitting} className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg disabled:opacity-50">
          ${submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 border-r border-[var(--app-border-soft)] p-2 overflow-y-auto">
          ${questions.map((qu, i) => html`
            <button
              key=${qu.id}
              onClick=${() => setCurrentIdx(i)}
              className=${`w-8 h-8 rounded text-sm flex items-center justify-center mb-1 ${
                currentIdx === i ? 'bg-[var(--app-accent)] text-white' : ''
              } ${responses[qu.id]?.selected_option != null ? 'ring-2 ring-[var(--app-accent)]' : 'bg-[var(--app-surface-muted)]'}`}
            >
              ${i + 1}
            </button>
          `)}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <p className="text-sm text-[var(--app-text-muted)] mb-2">${q.section} • ${(q.topic || '').replace(/_/g, ' ')}</p>
          <p className="text-[var(--app-text-primary)] whitespace-pre-wrap mb-4">${q.question_text}</p>
          ${(q.options || []).map((opt, i) => html`
            <label key=${i} className="flex items-center gap-2 cursor-pointer py-2">
              <input
                type="radio"
                name=${q.id}
                value=${opt}
                checked=${(responses[q.id]?.selected_option || '') === opt}
                onChange=${() => handleAnswer(q.id, opt)}
              />
              <span>${opt}</span>
            </label>
          `)}
        </div>
      </div>

      <div className="flex justify-between py-2 border-t border-[var(--app-border-soft)]">
        <button
          onClick=${() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled=${currentIdx === 0}
          className="px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick=${() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
          disabled=${currentIdx === questions.length - 1}
          className="px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  `;
};

export default CATMockTest;
