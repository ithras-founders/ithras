export function goLongForm(href) {
  window.history.pushState(null, '', href);
  window.dispatchEvent(new CustomEvent('ithras:path-changed'));
}
