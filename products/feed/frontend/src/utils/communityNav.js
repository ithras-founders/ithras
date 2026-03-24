/**
 * SPA navigation for community / channel feed URLs.
 */
export function navigateToCommunityAll(communitySlug) {
  if (!communitySlug) return;
  window.history.pushState(null, '', `/feed/c/${communitySlug}`);
  window.dispatchEvent(new CustomEvent('ithras:path-changed'));
}

export function navigateToCommunityChannel(communitySlug, channelSlug) {
  if (!communitySlug || !channelSlug) return;
  window.history.pushState(null, '', `/feed/c/${communitySlug}/ch/${channelSlug}`);
  window.dispatchEvent(new CustomEvent('ithras:path-changed'));
}
