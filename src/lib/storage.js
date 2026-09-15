const CHALLENGE_KEY = 'ks_challenge';
const FLASH_KEY = 'ks_flash';

/** The in-progress OTP challenge (login / email verification / phone verification / password reset). */
export function setChallenge(ch, context) {
  sessionStorage.setItem(CHALLENGE_KEY, JSON.stringify({ ...ch, context, issued_at: Date.now() }));
}
export function getChallenge() {
  try {
    return JSON.parse(sessionStorage.getItem(CHALLENGE_KEY) || 'null');
  } catch (e) {
    return null;
  }
}
export function clearChallenge() {
  sessionStorage.removeItem(CHALLENGE_KEY);
}

/** A one-shot toast queued before a hard/soft navigation (e.g. "session ended"). */
export function setFlash(flash) {
  sessionStorage.setItem(FLASH_KEY, JSON.stringify(flash));
}
export function takeFlash() {
  const raw = sessionStorage.getItem(FLASH_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(FLASH_KEY);
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
