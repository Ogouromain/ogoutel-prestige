// ============================================
// OGOUTEL_Prestige - Auth-aware fetch wrapper
// Stores the access_token after login and includes
// it in all API requests via Authorization header.
// ============================================

// In-memory token storage (survives across the session)
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

/**
 * Wrapper around fetch() that includes the Authorization header
 * with the stored access_token.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  if (_accessToken) {
    headers.set('Authorization', `Bearer ${_accessToken}`);
  }

  // Set Content-Type for JSON requests if not already set
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
