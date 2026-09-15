/* ==========================================================================
   Keystone API client
   Thin wrapper around fetch() for every Laravel auth-api v1 endpoint.
   Response envelope: { status: 'success'|'error', message, data?, errors?, meta?, links? }
   ========================================================================== */

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

export const TOKEN_KEY = 'ks_token';
export const TOKEN_TYPE_KEY = 'ks_token_type';
export const EXPIRES_AT_KEY = 'ks_expires_at';
export const USER_KEY = 'ks_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function getTokenType() {
  return localStorage.getItem(TOKEN_TYPE_KEY) || 'bearer';
}
export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch (e) {
    return null;
  }
}
export function persistSession({ access_token, token_type, expires_in, user }) {
  localStorage.setItem(TOKEN_KEY, access_token);
  localStorage.setItem(TOKEN_TYPE_KEY, token_type || 'bearer');
  localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + (expires_in || 0) * 1000));
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function persistUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearPersistedSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_TYPE_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  constructor(message, status, errors, meta) {
    super(message);
    this.status = status;
    this.errors = errors || null;
    this.meta = meta || null;
  }
}

/**
 * Fired whenever an authenticated request comes back 401. AuthProvider
 * registers a listener on mount so it can clear React state; the module
 * itself owns the actual redirect (see below) so it works even for calls
 * made before AuthProvider has mounted.
 */
const unauthorizedListeners = new Set();
export function onUnauthorized(fn) {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

let redirectingToLogin = false;
// Reset the guard whenever a fresh session is stored, so a later 401 can redirect again.
export function resetRedirectGuard() {
  redirectingToLogin = false;
}

async function request(method, path, { body, query, auth = false, raw = false } = {}) {
  let url = API_BASE + path;
  if (query) {
    const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''));
    const s = qs.toString();
    if (s) url += (url.includes('?') ? '&' : '?') + s;
  }

  const headers = { Accept: 'application/json' };
  const isFormData = body instanceof FormData;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';
  if (auth && getToken()) {
    const type = getTokenType();
    headers.Authorization = `${type.charAt(0).toUpperCase()}${type.slice(1)} ${getToken()}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError(`Could not reach the API. Is the backend running at ${API_BASE}?`, 0, null);
  }

  if (raw) return res;

  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    /* no body */
  }

  if (!res.ok) {
    if (import.meta.env.DEV) console.error(`API ${method} ${path} -> ${res.status}`, json);
    if (res.status === 401 && auth) {
      clearPersistedSession();
      unauthorizedListeners.forEach((fn) => fn());
      const onAuthPage = /\/(login|register|forgot-password|reset-password|verify-otp|activate-account|sso-callback)?$/.test(location.pathname.replace(/\/keystone/, ''));
      // Multiple authenticated calls can be in flight at once (e.g. current-user
      // fetch + unread-count on page load); only the first 401 should redirect.
      if (!onAuthPage && !redirectingToLogin) {
        redirectingToLogin = true;
        sessionStorage.setItem('ks_flash', JSON.stringify({ type: 'error', title: 'Session ended', msg: (json && json.message) || 'Please sign in again.' }));
        location.href = withBase('/login');
      }
    }
    throw new ApiError((json && json.message) || res.statusText || 'Request failed', res.status, json && json.errors, json && json.meta);
  }

  return json || {};
}

function withBase(path) {
  const base = import.meta.env.BASE_URL || '/';
  return (base.endsWith('/') ? base.slice(0, -1) : base) + path;
}

/**
 * The backend's OTP-challenge payloads (register, 2FA-login, resend-otp, send-phone-otp,
 * forgot-password's otp flow) are built as a DTO object and passed straight into
 * response()->json() without calling its toArray(), so PHP serializes the object's raw
 * camelCase properties (otpRequired/challengeToken/expiresIn) instead of the snake_case
 * keys that toArray() defines. Token/session and Resource-based responses are unaffected
 * and already come back snake_case. This normalizes either shape so the UI works today
 * (camelCase bug) and keeps working if that backend bug is ever fixed (snake_case).
 */
function dealiasOtp(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = { ...obj };
  if (out.otpRequired !== undefined && out.otp_required === undefined) out.otp_required = out.otpRequired;
  if (out.challengeToken !== undefined && out.challenge_token === undefined) out.challenge_token = out.challengeToken;
  if (out.expiresIn !== undefined && out.expires_in === undefined) out.expires_in = out.expiresIn;
  return out;
}
async function withDealiasedOtp(promise) {
  const res = await promise;
  return res && res.data ? { ...res, data: dealiasOtp(res.data) } : res;
}

export const Api = {
  health: () => request('GET', '/health'),

  // ---------- Auth ----------
  register: (payload) => withDealiasedOtp(request('POST', '/auth/register', { body: payload })),
  login: (payload) => withDealiasedOtp(request('POST', '/auth/login', { body: payload })),
  verifyOtp: (payload) => withDealiasedOtp(request('POST', '/auth/verify-otp', { body: payload })),
  resendOtp: (payload) => withDealiasedOtp(request('POST', '/auth/resend-otp', { body: payload })),
  forgotPassword: (payload) => withDealiasedOtp(request('POST', '/auth/forgot-password', { body: payload })),
  resetPassword: (payload) => request('POST', '/auth/reset-password', { body: payload }),
  activateAccount: (payload) => request('POST', '/auth/activate-account', { body: payload }),
  sendPhoneOtp: () => withDealiasedOtp(request('POST', '/auth/send-phone-otp', { auth: true })),
  refreshToken: () => request('POST', '/auth/refresh-token', { auth: true }),
  logout: () => request('POST', '/auth/logout', { auth: true }),

  // ---------- SSO ----------
  ssoUrl: (provider, successUrl) => request('GET', `/auth/sso/${provider}/url`, { query: { success_url: successUrl } }),
  ssoExchange: (code) => request('POST', '/auth/sso/exchange', { body: { code } }),

  // ---------- Current user ----------
  me: () => request('GET', '/users/me', { auth: true }),
  updateMe: (payload) => request('PATCH', '/users/me', { auth: true, body: payload }),
  changeMyPassword: (payload) => request('PATCH', '/users/me/password', { auth: true, body: payload }),

  // ---------- Two-factor authenticator ----------
  twoFaSetup: () => request('POST', '/user/two-fa/authenticator/setup', { auth: true }),
  twoFaQrSvg: async (secret) => {
    const res = await request('GET', '/user/two-fa/authenticator/qr-code', { auth: true, raw: true, query: { secret } });
    if (!res.ok) throw new ApiError('Could not render QR code', res.status);
    return res.text();
  },
  twoFaConfirm: (payload) => request('POST', '/user/two-fa/authenticator/confirm', { auth: true, body: payload }),
  twoFaEnable: () => request('POST', '/user/two-fa/enable', { auth: true }),
  twoFaDisable: () => request('DELETE', '/user/two-fa/disable', { auth: true }),
  twoFaSwitchMethod: (method) => request('POST', '/user/two-fa/method', { auth: true, body: { method } }),
  twoFaRegenerateCodes: () => request('POST', '/user/two-fa/recovery-codes/regenerate', { auth: true }),

  // ---------- Notifications ----------
  listNotifications: (query) => request('GET', '/notifications', { auth: true, query }),
  unreadCount: () => request('GET', '/notifications/unread-count', { auth: true }),
  getNotification: (id) => request('GET', `/notifications/${id}`, { auth: true }),
  markNotificationRead: (id) => request('PATCH', `/notifications/${id}/read`, { auth: true }),
  markAllNotificationsRead: () => request('PATCH', '/notifications/read-all', { auth: true }),
  deleteNotification: (id) => request('DELETE', `/notifications/${id}`, { auth: true }),

  // ---------- Users (admin) ----------
  listUsers: (query) => request('GET', '/users', { auth: true, query }),
  listAdmins: (query) => request('GET', '/users/admins', { auth: true, query }),
  createUser: (payload) => request('POST', '/users', { auth: true, body: payload }),
  getUser: (id) => request('GET', `/users/${id}`, { auth: true }),
  updateUser: (id, payload) => request('PATCH', `/users/${id}`, { auth: true, body: payload }),
  deleteUser: (id) => request('DELETE', `/users/${id}`, { auth: true }),
  activateUser: (id) => request('PATCH', `/users/${id}/activate`, { auth: true }),
  deactivateUser: (id) => request('PATCH', `/users/${id}/deactivate`, { auth: true }),
  assignRole: (userId, roleId) => request('POST', `/users/${userId}/roles/assign`, { auth: true, body: { role_id: roleId } }),
  revokeRole: (userId, roleId) => request('POST', `/users/${userId}/roles/revoke`, { auth: true, body: { role_id: roleId } }),

  // ---------- Roles & permissions ----------
  listRoles: (query) => request('GET', '/roles', { auth: true, query }),
  getRole: (id) => request('GET', `/roles/${id}`, { auth: true }),
  createRole: (payload) => request('POST', '/roles', { auth: true, body: payload }),
  updateRole: (id, payload) => request('PATCH', `/roles/${id}`, { auth: true, body: payload }),
  deleteRole: (id) => request('DELETE', `/roles/${id}`, { auth: true }),
  listPermissions: (query) => request('GET', '/roles/permissions', { auth: true, query }),
};
