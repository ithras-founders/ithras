import React, { createContext, useContext } from 'react';

const AppContext = createContext(null);

export const AppProvider = AppContext.Provider;

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
