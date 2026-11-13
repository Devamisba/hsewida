// Tab-isolated Auth Storage (Strictly scoped per tab/browser session)
// Ensures users must log in upon visiting the site, prevents cross-tab session leakage,
// and prevents persistent ghost sessions (such as auto-logging into previously tested roles).

const TOKEN_KEY = 'authToken';
const ROLE_KEY = 'userRole';
const USER_KEY = 'userData';

// Actively purge any legacy persistent localStorage auth keys from browser
// to prevent stale auto-login from previous test sessions
function purgeLegacyLocalStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('hse_auth_token');
    localStorage.removeItem('hse_user_role');
    localStorage.removeItem('hse_user_data');
  } catch {}
}

// Run cleanup immediately on load
purgeLegacyLocalStorage();

export const auth = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(TOKEN_KEY);
  },

  getRole(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(ROLE_KEY);
  },

  getUser(): any {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setSession(token: string, user: any) {
    if (typeof window === 'undefined') return;
    const roleCode = user?.role?.code || (typeof user?.role === 'string' ? user.role : 'admin');
    
    // Save strictly to sessionStorage for the active session
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(ROLE_KEY, roleCode);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));

    // Ensure localStorage never keeps residual auth keys
    purgeLegacyLocalStorage();

    window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: user }));
  },

  setUser(user: any) {
    if (typeof window === 'undefined') return;
    const userStr = JSON.stringify(user);
    sessionStorage.setItem(USER_KEY, userStr);
    window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: user }));
  },

  clearSession() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(USER_KEY);

    purgeLegacyLocalStorage();

    window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: null }));
  },

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getRole();
  },
};
