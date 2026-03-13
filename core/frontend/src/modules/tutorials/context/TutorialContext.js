import React, { createContext, useContext, useState, useCallback, useLayoutEffect } from 'react';
import { getTutorialMockData } from './tutorialMockData.js';

const TutorialContext = createContext(null);

const DEFAULT_CTX = Object.freeze({
  isTutorialMode: false,
  demoUser: null,
  demoRole: null,
  demoScopeView: null,
  initialDemoRole: null,
  startTutorial: () => {},
  startPageTutorial: () => {},
  endTutorial: () => {},
  getTutorialData: () => null,
});

export const useTutorialContext = () => {
  const ctx = useContext(TutorialContext);
  return ctx ?? DEFAULT_CTX;
};

export const TutorialProvider = ({ children, realUser, onTutorialEnd, initialDemoRole, initialScopeView }) => {
  const enteringDemo = !!(initialDemoRole && realUser?.role === initialDemoRole);
  const [isTutorialModeState, setIsTutorialModeState] = useState(false);
  const [demoRole, setDemoRole] = useState(null);
  const [demoUser, setDemoUser] = useState(null);
  const [demoScopeView, setDemoScopeView] = useState(null);
  const isTutorialMode = enteringDemo || isTutorialModeState;

  const startTutorial = useCallback((role) => {
    const mock = getTutorialMockData(role);
    setDemoRole(role);
    setDemoUser(mock.user);
    setDemoScopeView(null);
    setIsTutorialModeState(true);
  }, []);

  const startPageTutorial = useCallback((role, view) => {
    const mock = getTutorialMockData(role);
    setDemoRole(role);
    setDemoUser(mock.user);
    setDemoScopeView(view);
    setIsTutorialModeState(true);
  }, []);

  const endTutorial = useCallback(() => {
    setIsTutorialModeState(false);
    setDemoRole(null);
    setDemoUser(null);
    setDemoScopeView(null);
    onTutorialEnd?.();
  }, [onTutorialEnd]);

  const getTutorialData = useCallback((role) => {
    if (!isTutorialMode) return null;
    return getTutorialMockData(role || demoRole || initialDemoRole);
  }, [isTutorialMode, demoRole, initialDemoRole]);

  useLayoutEffect(() => {
    if (initialDemoRole && realUser && realUser.role === initialDemoRole) {
      if (initialScopeView) {
        startPageTutorial(initialDemoRole, initialScopeView);
      } else {
        startTutorial(initialDemoRole);
      }
    }
  }, [initialDemoRole, initialScopeView, realUser, startTutorial, startPageTutorial]);

  const value = {
    isTutorialMode,
    demoUser,
    demoRole,
    demoScopeView,
    initialDemoRole,
    startTutorial,
    startPageTutorial,
    endTutorial,
    getTutorialData,
    effectiveUser: isTutorialMode ? (demoUser || realUser) : realUser,
  };

  return React.createElement(TutorialContext.Provider, { value }, children);
};
