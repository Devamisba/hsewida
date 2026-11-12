// Smart Auth Storage: Prioritize tab-isolated sessionStorage with seamless localStorage fallback
// Allows new tabs to inherit session automatically, while still keeping multi-role flexibility

const TOKEN_KEY = 'authToken';
const ROLE_KEY = 'userRole';
const USER_KEY = 'userData';

// Sync session from localStorage to sessionStorage if sessionStorage is empty on new tab
function hydrateSessionFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const sessionToken = sessionStorage.getItem(TOKEN_KEY);
    if (!sessionToken) {
      const localToken = localStorage.getItem(TOKEN_KEY);
      if (localToken) {
        sessionStorage.setItem(TOKEN_KEY, localToken);
        const localRole = localStorage.getItem(ROLE_KEY);
        if (localRole) sessionStorage.setItem(ROLE_KEY, localRole);
        const localUser = localStorage.getItem(USER_KEY);
        if (localUser) sessionStorage.setItem(USER_KEY, localUser);
      }
    }
  } catch {}
}

export const auth = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    let token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      hydrateSessionFromStorage();
      token = sessionStorage.getItem(TOKEN_KEY);
    }
    return token;
  },

  getRole(): string | null {
    if (typeof window === 'undefined') return null;
    let role = sessionStorage.getItem(ROLE_KEY);
    if (!role) {
      hydrateSessionFromStorage();
      role = sessionStorage.getItem(ROLE_KEY);
    }
    return role;
  },

  getUser(): any {
    if (typeof window === 'undefined') return null;
    try {
      let raw = sessionStorage.getItem(USER_KEY);
      if (!raw) {
        hydrateSessionFromStorage();
        raw = sessionStorage.getItem(USER_KEY);
      }
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setSession(token: string, user: any) {
    if (typeof window === 'undefined') return;
    const roleCode = user?.role?.code || (typeof user?.role === 'string' ? user.role : 'admin');
    
    // Save to both sessionStorage (active tab) and localStorage (cross-tab / new tabs inheritance)
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(ROLE_KEY, roleCode);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));

    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(ROLE_KEY, roleCode);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}

    window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: user }));
  },

  setUser(user: any) {
    if (typeof window === 'undefined') return;
    const userStr = JSON.stringify(user);
    sessionStorage.setItem(USER_KEY, userStr);
    try {
      localStorage.setItem(USER_KEY, userStr);
    } catch {}
    window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: user }));
  },

  clearSession() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(USER_KEY);

    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}

    window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: null }));
  },

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getRole();
  },
};
