import React, { useEffect, useState, useRef } from 'react';
import Joyride from 'react-joyride';
import { getTutorialSteps, getTutorialStepsForPage } from '../context/tutorialSteps.js';

/**
 * Guided tour overlay using react-joyride.
 * Navigates views and highlights elements step by step.
 * Uses controlled stepIndex so we only advance after the target exists in the DOM.
 */
const TARGET_POLL_INTERVAL_MS = 50;
const TARGET_POLL_MAX_ATTEMPTS = 400;
const TARGET_POLL_FALLBACK_MS = 20000;
const VIEW_CHANGE_DELAY_MS = 200;
const PRODUCT_SWITCH_DELAY_MS = 450;

function waitForTarget(selector, onFound, onTimeout, intervalMs = TARGET_POLL_INTERVAL_MS, maxAttempts = TARGET_POLL_MAX_ATTEMPTS) {
  let attempts = 0;
  const id = setInterval(() => {
    if (document.querySelector(selector)) {
      clearInterval(id);
      onFound();
    } else if (++attempts >= maxAttempts) {
      clearInterval(id);
      onTimeout?.();
    }
  }, intervalMs);
  return () => clearInterval(id);
}

const GuidedTour = ({ run, demoRole, setView, onComplete, contentReady = true, view = '', scopeView }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetReady, setTargetReady] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const pollCleanupRef = useRef(null);
  const hasNavigatedRef = useRef(false);

  const steps = demoRole
    ? (scopeView ? getTutorialStepsForPage(demoRole, scopeView) : getTutorialSteps(demoRole))
    : [];
  const joyrideSteps = steps.map(({ target, title, content }) => ({
    target,
    title: title || '',
    content: content || '',
    disableBeacon: true,
  }));

  const runTour = run && contentReady;

  useEffect(() => {
    if (!runTour) {
      setTargetReady(false);
      setTransitioning(false);
      hasNavigatedRef.current = false;
      return;
    }
  }, [runTour]);

  useEffect(() => {
    if (!runTour || hasNavigatedRef.current || !demoRole || scopeView) return;
    const tourSteps = getTutorialSteps(demoRole);
    if (tourSteps.length === 0) return;
    const firstStep = tourSteps[0];
    if (firstStep?.view && firstStep.view !== view && setView) {
      setView(firstStep.view);
    }
    hasNavigatedRef.current = true;
  }, [runTour, demoRole, setView, view, scopeView]);

  useEffect(() => {
    if (runTour) {
      setStepIndex(0);
    }
  }, [runTour]);

  useEffect(() => {
    if (!runTour || !demoRole) return;
    const tourSteps = scopeView ? getTutorialStepsForPage(demoRole, scopeView) : getTutorialSteps(demoRole);
    if (tourSteps.length === 0) return;
    const firstTarget = tourSteps[0].target;
    const onReady = () => {
      if (pollCleanupRef.current) {
        pollCleanupRef.current();
        pollCleanupRef.current = null;
      }
      setTargetReady(true);
    };
    const onTimeout = () => {
      if (pollCleanupRef.current) {
        pollCleanupRef.current();
        pollCleanupRef.current = null;
      }
      console.warn('[GuidedTour] First target not found within poll window; tour will not start');
      // Do NOT set targetReady - Joyride crashes when target is null (react-floater nodeName error)
    };
    const firstPollAttempts = Math.ceil(TARGET_POLL_FALLBACK_MS / TARGET_POLL_INTERVAL_MS);
    pollCleanupRef.current = waitForTarget(
      firstTarget,
      onReady,
      onTimeout,
      TARGET_POLL_INTERVAL_MS,
      firstPollAttempts
    );
    return () => {
      if (pollCleanupRef.current) {
        pollCleanupRef.current();
        pollCleanupRef.current = null;
      }
    };
  }, [runTour, demoRole, scopeView]);

  useEffect(() => {
    return () => {
      if (pollCleanupRef.current) {
        pollCleanupRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (!runTour || !targetReady || transitioning) return;
    const tourSteps = scopeView
      ? getTutorialStepsForPage(demoRole, scopeView)
      : demoRole
        ? getTutorialSteps(demoRole)
        : [];
    const target = tourSteps[stepIndex]?.target;
    if (!target || tourSteps.length === 0) return;
    if (!document.querySelector(target)) {
      onComplete?.();
    }
  }, [runTour, targetReady, transitioning, demoRole, scopeView, stepIndex, onComplete]);

  const handleCallback = (data) => {
    const { action, index, status, type } = data;

    const isTourComplete =
      status === 'finished' ||
      type === 'tour:end' ||
      (action === 'next' && index >= steps.length - 1);

    if (isTourComplete) {
      if (pollCleanupRef.current) {
        pollCleanupRef.current();
        pollCleanupRef.current = null;
      }
      onComplete?.();
      return;
    }
    if ((type === 'step:after' || type === 'step:before') && action === 'prev' && index > 0) {
      const prevStep = steps[index - 1];
      const prevIndex = index - 1;
      const needsViewChange = !scopeView && prevStep?.view && prevStep.view !== view;

      setTransitioning(true);
      if (needsViewChange && setView) {
        setView(prevStep.view);
      }

      const advance = () => {
        if (pollCleanupRef.current) {
          pollCleanupRef.current();
          pollCleanupRef.current = null;
        }
        setTransitioning(false);
        setStepIndex(prevIndex);
      };

      let targetPollCleanup = null;
      const onPrevTimeout = () => {
        if (targetPollCleanup) targetPollCleanup();
        setTransitioning(false);
        console.warn('[GuidedTour] Prev step target not found', { target: prevStep.target, view: prevStep.view });
      };
      const startPoll = () => {
        targetPollCleanup = waitForTarget(
          prevStep.target,
          advance,
          onPrevTimeout,
          TARGET_POLL_INTERVAL_MS,
          TARGET_POLL_MAX_ATTEMPTS
        );
        pollCleanupRef.current = () => {
          if (targetPollCleanup) targetPollCleanup();
          pollCleanupRef.current = null;
        };
      };
      const isProductSwitch = ['cv', 'calendar', 'system-admin/people', 'system-admin/institutions', 'system-admin/companies', 'system-admin/access', 'telemetry/overview', 'telemetry/api', 'telemetry/pages', 'telemetry/users', 'telemetry/database'].some(p => prevStep?.view?.startsWith?.(p) || prevStep?.view === p);
      const delay = needsViewChange ? (isProductSwitch ? PRODUCT_SWITCH_DELAY_MS : VIEW_CHANGE_DELAY_MS) : 0;
      const timer = setTimeout(startPoll, delay);
      pollCleanupRef.current = () => {
        clearTimeout(timer);
        if (targetPollCleanup) targetPollCleanup();
        pollCleanupRef.current = null;
      };
      return;
    }
    if ((type === 'step:after' || type === 'step:before') && action === 'next' && index < steps.length - 1) {
      const nextStep = steps[index + 1];
      const nextIndex = index + 1;
      const needsViewChange = !scopeView && nextStep?.view && nextStep.view !== view;

      setTransitioning(true);
      if (needsViewChange && setView) {
        setView(nextStep.view);
      }

      const advance = () => {
        if (pollCleanupRef.current) {
          pollCleanupRef.current();
          pollCleanupRef.current = null;
        }
        setTransitioning(false);
        setStepIndex(nextIndex);
      };

      let targetPollCleanup = null;
      const onNextTimeout = () => {
        if (targetPollCleanup) targetPollCleanup();
        setTransitioning(false);
        console.warn('[GuidedTour] Next step target not found', { target: nextStep.target, view: nextStep.view, stepIndex: nextIndex });
        setStepIndex(nextIndex);
      };
      const startPoll = () => {
        targetPollCleanup = waitForTarget(
          nextStep.target,
          advance,
          onNextTimeout,
          TARGET_POLL_INTERVAL_MS,
          TARGET_POLL_MAX_ATTEMPTS
        );
        pollCleanupRef.current = () => {
          if (targetPollCleanup) targetPollCleanup();
          pollCleanupRef.current = null;
        };
      };
      const isProductSwitch = ['cv', 'calendar', 'system-admin/people', 'system-admin/institutions', 'system-admin/companies', 'system-admin/access', 'telemetry/overview', 'telemetry/api', 'telemetry/pages', 'telemetry/users', 'telemetry/database'].some(p => nextStep?.view?.startsWith?.(p) || nextStep?.view === p);
      const delay = needsViewChange ? (isProductSwitch ? PRODUCT_SWITCH_DELAY_MS : VIEW_CHANGE_DELAY_MS) : 0;
      const timer = setTimeout(startPoll, delay);
      pollCleanupRef.current = () => {
        clearTimeout(timer);
        if (targetPollCleanup) targetPollCleanup();
        pollCleanupRef.current = null;
      };
    }
  };

  if (!run || joyrideSteps.length === 0) return null;

  const currentStepTarget = joyrideSteps[stepIndex]?.target;
  const targetExists =
    typeof document !== 'undefined' &&
    currentStepTarget &&
    !!document.querySelector(currentStepTarget);

  if (runTour && targetReady && !transitioning && !targetExists) {
    return null;
  }

  return React.createElement(Joyride, {
    steps: joyrideSteps,
    run: runTour && targetReady && !transitioning && targetExists,
    stepIndex,
    continuous: true,
    showProgress: true,
    showSkipButton: false,
    disableOverlayClose: true,
    hideCloseButton: true,
    callback: handleCallback,
    disableScrolling: false,
    locale: { back: 'Back', next: 'Next', last: 'Finish Tour' },
    floaterProps: { disableAnimation: false },
    styles: {
      options: { primaryColor: '#4f46e5', zIndex: 10000, overlayColor: 'rgba(15, 23, 42, 0.65)' },
      tooltip: { borderRadius: 20, padding: '24px 28px', fontSize: 14, maxWidth: 420 },
      tooltipTitle: { fontSize: 18, fontWeight: 900 },
      tooltipContent: { fontSize: 14, lineHeight: 1.6 },
      buttonNext: { backgroundColor: '#4f46e5', borderRadius: 12, padding: '10px 20px', fontWeight: 700, fontSize: 13 },
      buttonBack: { color: '#64748b', fontWeight: 700, fontSize: 13 },
      buttonSkip: { color: '#94a3b8', fontSize: 12 },
      spotlight: { borderRadius: 16 },
    },
  });
};

export default GuidedTour;
