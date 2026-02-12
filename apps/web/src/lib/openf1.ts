/**
 * OpenF1 Authenticated API Client
 *
 * Provides a drop-in fetch wrapper that adds OAuth2 authentication
 * when credentials are configured. Falls back to the public API otherwise.
 */

const OPENF1_BASE = "https://api.openf1.org/v1";
const OPENF1_TOKEN_URL = "https://api.openf1.org/token";

// Refresh token 5 minutes before expiry
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
// After a failed token fetch, wait before retrying (avoids spamming on 503)
const TOKEN_RETRY_COOLDOWN_MS = 60 * 1000;

// --- Singleton Token State (shared across all routes via globalThis) ---

interface TokenState {
  accessToken: string;
  expiresAt: number;
  refreshPromise: Promise<string | null> | null;
}

// Use globalThis to share token state across Next.js route module boundaries
const globalForOpenF1 = globalThis as unknown as {
  __openf1Token: TokenState | null;
  __openf1LastFailure: number;
};
if (!globalForOpenF1.__openf1Token) globalForOpenF1.__openf1Token = null;
if (!globalForOpenF1.__openf1LastFailure) globalForOpenF1.__openf1LastFailure = 0;

// --- Credentials ---

function getCredentials(): { username: string; password: string } | null {
  const username = process.env.OPENF1_USERNAME;
  const password = process.env.OPENF1_PASSWORD;
  if (!username || !password) return null;
  return { username, password };
}

// --- Token Management ---

async function fetchToken(): Promise<string | null> {
  const creds = getCredentials();
  if (!creds) return null;

  try {
    const response = await fetch(OPENF1_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username: creds.username,
        password: creds.password,
        grant_type: "password",
      }),
    });

    if (!response.ok) {
      console.error(`[OpenF1 Auth] Token error: ${response.status} ${response.statusText}`);
      globalForOpenF1.__openf1LastFailure = Date.now();
      return null;
    }

    const data = await response.json();
    const expiresIn = (data.expires_in || 3600) * 1000;

    globalForOpenF1.__openf1Token = {
      accessToken: data.access_token,
      expiresAt: Date.now() + expiresIn,
      refreshPromise: null,
    };
    globalForOpenF1.__openf1LastFailure = 0;

    console.log("[OpenF1 Auth] Token acquired, expires in", Math.round(expiresIn / 60000), "minutes");
    return data.access_token;
  } catch (error) {
    console.error("[OpenF1 Auth] Token fetch failed:", error);
    globalForOpenF1.__openf1LastFailure = Date.now();
    return null;
  }
}

async function getToken(): Promise<string | null> {
  if (!getCredentials()) return null;

  const tokenState = globalForOpenF1.__openf1Token;

  // Token exists and is still valid (with buffer)
  if (tokenState && Date.now() < tokenState.expiresAt - TOKEN_REFRESH_BUFFER_MS) {
    return tokenState.accessToken;
  }

  // Cooldown after failed attempt — skip token fetch, use public API
  if (globalForOpenF1.__openf1LastFailure &&
      Date.now() - globalForOpenF1.__openf1LastFailure < TOKEN_RETRY_COOLDOWN_MS) {
    return null;
  }

  // Deduplicate concurrent refresh requests
  if (tokenState?.refreshPromise) {
    return tokenState.refreshPromise;
  }

  const refreshPromise = fetchToken();
  if (tokenState) {
    tokenState.refreshPromise = refreshPromise;
  }

  const token = await refreshPromise;

  if (globalForOpenF1.__openf1Token) {
    globalForOpenF1.__openf1Token.refreshPromise = null;
  }

  return token;
}

// --- Authenticated Fetch ---

interface OpenF1FetchOptions {
  /** Number of retries on 429/5xx responses. Default: 3 */
  retries?: number;
  /** Initial delay in ms between retries (doubles each retry). Default: 500 */
  retryDelay?: number;
  /** Next.js fetch options */
  next?: { revalidate?: number | false };
  /** Standard fetch cache option */
  cache?: RequestCache;
}

export async function openf1Fetch(
  endpoint: string,
  options: OpenF1FetchOptions = {}
): Promise<Response> {
  const { retries = 3, retryDelay = 500, ...fetchOptions } = options;

  const url = endpoint.startsWith("http") ? endpoint : `${OPENF1_BASE}${endpoint}`;

  const headers: Record<string, string> = {};
  const token = await getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (response.ok) {
      return response;
    }

    // On 401: first attempt refreshes token, subsequent attempts retry without auth
    if (response.status === 401) {
      if (attempt === 0) {
        // Try refreshing the token
        globalForOpenF1.__openf1Token = null;
        const newToken = await getToken();
        if (newToken) {
          headers["Authorization"] = `Bearer ${newToken}`;
        } else {
          delete headers["Authorization"];
        }
        continue;
      }
      // On later 401s, backoff and retry (public API can be intermittently 401)
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delete headers["Authorization"];
        continue;
      }
    }

    // Rate limited or server error — backoff and retry
    if ((response.status === 429 || response.status >= 500) && attempt < retries) {
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    return response;
  }

  throw new Error("openf1Fetch: exceeded retries");
}

// --- Exports ---

export { OPENF1_BASE };

export function isOpenF1AuthEnabled(): boolean {
  return getCredentials() !== null;
}
