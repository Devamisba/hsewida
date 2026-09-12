// API Base URL from env or default local Laravel server
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Helper for authenticated fetch
export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('authToken');
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Request failed with status ' + res.status);
    }
    return data;
  } catch (err: any) {
    console.warn(`[API] Call to ${endpoint} failed, falling back if available:`, err.message);
    throw err;
  }
}

// Mock data for offline fallback
export const MOCK_DASHBOARD_METRICS = {
  activePermits: 42,
  safeWorkHours: 12500,
  nearMissReports: 3,
};

export const MOCK_FACILITY_STATUS = [
  { id: 1, name: "APAR (Fire Extinguisher)", status: "Good", lastChecked: "2026-08-25" },
  { id: 2, name: "Hydrant Monitoring", status: "Needs Attention", lastChecked: "2026-08-20" },
  { id: 3, name: "Emergency Door", status: "Good", lastChecked: "2026-08-25" },
  { id: 4, name: "P3K (First Aid Kit)", status: "Expired", lastChecked: "2026-08-15" },
  { id: 5, name: "Safety Mirror", status: "Good", lastChecked: "2026-08-25" },
  { id: 6, name: "Assembly Point", status: "Good", lastChecked: "2026-08-25" },
];

export const MOCK_CHART_DATA = [
  { name: "Week 1", incidents: 0, nearMiss: 1, safeDays: 7 },
  { name: "Week 2", incidents: 0, nearMiss: 0, safeDays: 7 },
  { name: "Week 3", incidents: 0, nearMiss: 1, safeDays: 7 },
  { name: "Week 4", incidents: 0, nearMiss: 0, safeDays: 7 },
];

// Unified API Service for frontend components
export const api = {
  // 1. Auth API
  login: async (email: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async () => {
    try {
      return await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      return { success: true };
    }
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },

  // 2. Work Permits
  submitWorkPermit: async (payload: any) => {
    return await apiRequest('/permits', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMyRequests: async () => {
    return apiRequest('/permits/my-requests');
  },

  getReviewQueue: async () => {
    return apiRequest('/permits/review-queue');
  },

  getHistory: async () => {
    return apiRequest('/permits/history');
  },

  getPermitDetail: async (id: string | number) => {
    return apiRequest(`/permits/${id}`);
  },

  approvePermit: async (id: string | number, note?: string) => {
    return apiRequest(`/permits/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  rejectPermit: async (id: string | number, rejectReason: string) => {
    return apiRequest(`/permits/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reject_reason: rejectReason }),
    });
  },

  // 3. Master Data
  getLocations: async () => {
    return apiRequest('/master/locations');
  },

  getPermitTypes: async () => {
    return apiRequest('/master/permit-types');
  },

  getPpeOptions: async () => {
    return apiRequest('/master/ppe-options');
  },

  getRoles: async () => {
    return apiRequest('/master/roles');
  },

  // 4. Monitoring & K3
  getFacilities: async (category?: string) => {
    const query = category ? `?category=${category}` : '';
    return apiRequest(`/monitoring/facilities${query}`);
  },

  submitInspection: async (payload: any) => {
    return apiRequest('/monitoring/inspections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getDashboardData: async () => {
    try {
      const data = await apiRequest('/monitoring/spi-metrics');
      return {
        metrics: {
          activePermits: 42,
          safeWorkHours: data.data.safeWorkHours,
          nearMissReports: data.data.nearMissReports,
        },
        facilities: MOCK_FACILITY_STATUS,
        chartData: data.data.chartData,
      };
    } catch {
      return {
        metrics: MOCK_DASHBOARD_METRICS,
        facilities: MOCK_FACILITY_STATUS,
        chartData: MOCK_CHART_DATA,
      };
    }
  },

  updateFacilityStatus: async (facilityId: number, newStatus: string) => {
    console.log(`Mock API: Updating facility ${facilityId} to ${newStatus}`);
    return { success: true };
  }
};
