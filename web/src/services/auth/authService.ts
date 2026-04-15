/**
 * Auth service – fetches authentication context from the backend.
 * In Phase 2 the backend handles ADFS/OAuth2 token acquisition;
 * the frontend just needs the org URL and bearer token to make
 * direct Web API calls (BEContext pattern).
 */

export interface AuthContext {
  token: string
  orgUrl: string
  apiVersion: string
  webApiBase: string
}

export interface AuthHealth {
  status: 'ok' | 'error'
  hasToken?: boolean
  message?: string
}

/**
 * Retrieves the current authentication context from the backend.
 * The backend resolves the ADFS token and returns it to the frontend.
 */
export async function fetchAuthContext(baseApiUrl: string): Promise<AuthContext> {
  const res = await fetch(`${baseApiUrl}/api/auth/context`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Auth context request failed (${res.status}): ${text}`)
  }
  return res.json() as Promise<AuthContext>
}

/**
 * Checks whether the backend can successfully acquire a token from ADFS.
 */
export async function checkAuthHealth(baseApiUrl: string): Promise<AuthHealth> {
  const res = await fetch(`${baseApiUrl}/api/auth/health`)
  return res.json() as Promise<AuthHealth>
}
