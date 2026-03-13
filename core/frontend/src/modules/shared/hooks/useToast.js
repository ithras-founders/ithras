import React, { createContext, useContext, useState, useCallback } from 'react';
import htm from 'htm';
import Toast from '../components/Toast.js';
import { DialogContext } from '../components/DialogProvider.js';

const html = htm.bind(React.createElement);

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return html`
    <${ToastContext.Provider} value=${{ toast, success: (m) => toast(m, 'success'), error: (m) => toast(m, 'error') }}>
      ${children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        ${toasts.map(t => html`
          <${Toast}
            key=${t.id}
            message=${t.message}
            type=${t.type}
            onDismiss=${() => removeToast(t.id)}
          />
        `)}
      </div>
    <//>
  `;
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  const dialogCtx = useContext(DialogContext);
  if (!ctx) {
    const showFallback = (m) => {
      if (dialogCtx?.alert) {
        dialogCtx.alert({ title: 'Notice', message: m });
      } else {
        console.warn('useToast: ToastContext not found. Ensure ToastProvider wraps your app. Message:', m);
      }
    };
    return {
      toast: (m) => showFallback(m),
      success: (m) => showFallback(m),
      error: (m) => showFallback(m),
    };
  }
  return ctx;
};
