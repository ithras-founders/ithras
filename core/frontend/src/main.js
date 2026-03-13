import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { ToastProvider, DialogProvider } from './modules/shared/index.js';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  React.createElement(React.StrictMode, null,
    React.createElement(ToastProvider, null,
      React.createElement(DialogProvider, null,
        React.createElement(App, null)
      )
    )
  )
);
