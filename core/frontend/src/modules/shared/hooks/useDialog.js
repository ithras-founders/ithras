import { useContext } from 'react';
import { DialogContext } from '../components/DialogProvider.js';

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    console.warn('useDialog: DialogContext not found. Ensure DialogProvider wraps your app. Falling back to no-op.');
    return {
      confirm: () => Promise.resolve(false),
      alert: () => Promise.resolve(),
      prompt: () => Promise.resolve(null),
    };
  }
  return ctx;
};
