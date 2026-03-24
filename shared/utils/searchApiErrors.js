/**
 * User-friendly messages for search (quiet apiRequest uses short connectivity errors; dev hints live in UI).
 */

export const SEARCH_ERROR_PUBLIC_TITLE = 'Search is unavailable right now';

export const SEARCH_ERROR_PUBLIC_SUMMARY = 'We could not connect to the search service. Check your network and try again.';

export const SEARCH_ERROR_HINTS = [
  'Run `python frontend_server.py` and open http://localhost:5000 with the API on :8000 (proxies /api).',
  'Or proxy `/api` from your dev server to the backend.',
  'Or in the browser console: sessionStorage.setItem("ithras_api_base","http://127.0.0.1:8000/api") then reload.',
];

/** @deprecated Use SEARCH_ERROR_PUBLIC_TITLE in UI copy; kept for tests or external imports. */
export const SEARCH_ERROR_TITLE = "Can't reach the search service";

/** Repo-relative path for contributors (shown in UI). */
export const SEARCH_DEV_DOC_PATH = 'docs/LOCAL_DEV.md';

const CONNECTIVITY_PATTERN =
  /Could not reach the API|Could not complete the request|Network error|Failed to fetch|not reachable|Backend not available|503/i;

/**
 * @param {unknown} err
 * @returns {{
 *   shortTitle: string,
 *   userSummary: string | null,
 *   devHints: string[] | null,
 *   hints: string[] | null,
 *   rawMessage: string,
 *   showRawDetails: boolean,
 * }}
 */
export function formatSearchApiError(err) {
  const rawMessage = err instanceof Error ? err.message : String(err || 'Search failed');
  const isConnectivity = CONNECTIVITY_PATTERN.test(rawMessage);
  if (isConnectivity) {
    return {
      shortTitle: SEARCH_ERROR_PUBLIC_TITLE,
      userSummary: SEARCH_ERROR_PUBLIC_SUMMARY,
      devHints: SEARCH_ERROR_HINTS,
      hints: null,
      rawMessage,
      showRawDetails: false,
    };
  }
  return {
    shortTitle: 'Search failed',
    userSummary: null,
    devHints: null,
    hints: [rawMessage],
    rawMessage,
    showRawDetails: false,
  };
}
