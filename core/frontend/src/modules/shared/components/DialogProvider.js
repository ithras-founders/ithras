import React, { createContext, useState, useCallback } from 'react';
import htm from 'htm';
import ConfirmDialog from './ConfirmDialog.js';
import AlertDialog from './AlertDialog.js';
import PromptDialog from './PromptDialog.js';

const html = htm.bind(React.createElement);

export const DialogContext = createContext(null);

export const DialogProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({ open: false });
  const [alertState, setAlertState] = useState({ open: false });
  const [promptState, setPromptState] = useState({ open: false });

  const confirm = useCallback(({ title = 'Confirm', message, confirmLabel = 'OK', cancelLabel = 'Cancel' } = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        open: true,
        title,
        message,
        confirmLabel,
        cancelLabel,
        onConfirm: () => {
          setConfirmState(s => ({ ...s, open: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(s => ({ ...s, open: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const alert = useCallback(({ title = 'Notice', message } = {}) => {
    return new Promise((resolve) => {
      setAlertState({
        open: true,
        title,
        message,
        onClose: () => {
          setAlertState(s => ({ ...s, open: false }));
          resolve();
        },
      });
    });
  }, []);

  const prompt = useCallback(({ title = 'Input', promptMessage, defaultValue = '' } = {}) => {
    return new Promise((resolve) => {
      setPromptState({
        open: true,
        title,
        promptMessage,
        defaultValue,
        onSubmit: (value) => {
          setPromptState(s => ({ ...s, open: false }));
          resolve(value);
        },
        onCancel: () => {
          setPromptState(s => ({ ...s, open: false }));
          resolve(null);
        },
      });
    });
  }, []);

  const value = { confirm, alert, prompt };

  return html`
    <${DialogContext.Provider} value=${value}>
      ${children}
      <${ConfirmDialog}
        open=${confirmState.open}
        title=${confirmState.title}
        message=${confirmState.message}
        confirmLabel=${confirmState.confirmLabel}
        cancelLabel=${confirmState.cancelLabel}
        onConfirm=${confirmState.onConfirm}
        onCancel=${confirmState.onCancel}
      />
      <${AlertDialog}
        open=${alertState.open}
        title=${alertState.title}
        message=${alertState.message}
        onClose=${alertState.onClose}
      />
      <${PromptDialog}
        open=${promptState.open}
        title=${promptState.title}
        promptMessage=${promptState.promptMessage}
        defaultValue=${promptState.defaultValue}
        onSubmit=${promptState.onSubmit}
        onCancel=${promptState.onCancel}
      />
    <//>
  `;
};
