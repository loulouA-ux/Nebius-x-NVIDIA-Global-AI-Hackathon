export const sessionExpiredEvent = "shipcheck:session-expired";

export function notifySessionExpired() {
  window.dispatchEvent(new Event(sessionExpiredEvent));
}
