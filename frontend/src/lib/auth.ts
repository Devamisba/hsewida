// Tab-isolated Auth Storage (Strictly scoped per tab so users can test multi-roles simultaneously)

const TOKEN_KEY = 'authToken';
const ROLE_KEY = 'userRole';
const USER_KEY = 'userData';

// Clean up any legacy localStorage keys to avoid cross-tab session leakage
try {
  localStorage.removeItem('hse_auth_token');
  localStorage.removeItem('hse_user_role');
  localStorage.removeItem('hse_user_data');
} catch {}

export const auth = {
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  getRole(): string | null {
    return sessionStorage.getItem(ROLE_KEY);
  },

  getUser(): any {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setSession(token: string, user: any) {
    const roleCode = user?.role?.code || (typeof user?.role === 'string' ? user.role : 'admin');
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(ROLE_KEY, roleCode);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  setUser(user: any) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getRole();
  },
};
