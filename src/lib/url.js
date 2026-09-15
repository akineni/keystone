/** Builds an absolute URL under the app's own origin, e.g. absoluteUrl('sso-callback')
 *  -> http://localhost:5173/sso-callback. Used for the SSO success_url the
 *  backend redirects back to (with #code=... appended). */
export function absoluteUrl(path) {
  const trimmedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${window.location.origin}/${trimmedPath}`;
}
