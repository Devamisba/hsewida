// Persistent Auth Storage with Multi-tab & QR Scan Continuity

const TOKEN_KEY = 'authToken';
const ROLE_KEY = 'userRole';
const USER_KEY = 'userData';

export const auth = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    let token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        sessionStorage.setItem(TOKEN_KEY, token);
      }
    }
    return token;
  },

  getRole(): string | null {
    if (typeof window === 'undefined') return null;
    let role = sessionStorage.getItem(ROLE_KEY);
    if (!role) {
      role = localStorage.getItem(ROLE_KEY);
      if (role) {
        sessionStorage.setItem(ROLE_KEY, role);
      }
    }
    return role;
  },

  getUser(): any {
    if (typeof window === 'undefined') return null;
    try {
      let raw = sessionStorage.getItem(USER_KEY);
      if (!raw) {
        raw = localStorage.getItem(USER_KEY);
        if (raw) {
          sessionStorage.setItem(USER_KEY, raw);
        }
      }
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setSession(token: string, user: any) {
    if (typeof window === 'undefined') return;
    const roleCode = user?.role?.code || (typeof user?.role === 'string' ? user.role : 'admin');
    
    // Save to both sessionStorage (tab) and localStorage (persistent across camera scans / new tabs)
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(ROLE_KEY, roleCode);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY, roleCode);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: user }));
  },

  setUser(user: any) {
    if (typeof window === 'undefined') return;
    const userStr = JSON.stringify(user);
    sessionStorage.setItem(USER_KEY, userStr);
    localStorage.setItem(USER_KEY, userStr);
    window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: user }));
  },

  clearSession() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(USER_KEY);

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);

    window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: null }));
  },

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getRole();
  },
};

