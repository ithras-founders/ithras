/**
 * Theme persistence for data-theme on documentElement.
 * Values: 'light' | 'dark'
 */
const STORAGE_KEY = 'ithras_theme';

export function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch (_) { /* ignore */ }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyThemeToDocument(theme) {
  const t = theme === 'dark' ? 'dark' : 'light';
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = t;
  }
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch (_) { /* ignore */ }
  return t;
}
