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

  closePermit: async (id: string | number, payload?: any) => {
    return apiRequest(`/permits/${id}/close`, {
      method: 'POST',
      body: JSON.stringify(payload || { housekeeping_clean: true, tools_cleared: true }),
    });
  },

  verifyQrToken: async (token: string) => {
    return apiRequest(`/permits/verify/${token}`);
  },

  // 3. User Management (CRUD)
  getUsers: async (params?: { role?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append('role', params.role);
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString();
    return apiRequest(`/master/users${qs ? '?' + qs : ''}`);
  },

  createUser: async (payload: any) => {
    return apiRequest('/master/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateUser: async (id: number | string, payload: any) => {
    return apiRequest(`/master/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  resetUserPassword: async (id: number | string, newPassword: string) => {
    return apiRequest(`/master/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    });
  },

  deleteUser: async (id: number | string) => {
    return apiRequest(`/master/users/${id}`, {
      method: 'DELETE',
    });
  },

  // 4. Roles & Permissions (Dynamic RBAC)
  getRoles: async () => {
    return apiRequest('/master/roles');
  },

  createRole: async (payload: any) => {
    return apiRequest('/master/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateRole: async (id: number | string, payload: any) => {
    return apiRequest(`/master/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteRole: async (id: number | string) => {
    return apiRequest(`/master/roles/${id}`, {
      method: 'DELETE',
    });
  },

  getPermissions: async () => {
    return apiRequest('/master/permissions');
  },

  updateRolePermissions: async (roleId: number | string, permissionIds: number[]) => {
    return apiRequest(`/master/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
  },

  // 5. Permit Types
  getPermitTypes: async () => {
    return apiRequest('/master/permit-types');
  },

  createPermitType: async (payload: any) => {
    return apiRequest('/master/permit-types', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updatePermitType: async (id: number | string, payload: any) => {
    return apiRequest(`/master/permit-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deletePermitType: async (id: number | string) => {
    return apiRequest(`/master/permit-types/${id}`, {
      method: 'DELETE',
    });
  },

  // 6. PPE Options
  getPpeOptions: async () => {
    return apiRequest('/master/ppe-options');
  },

  createPpeOption: async (payload: any) => {
    return apiRequest('/master/ppe-options', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updatePpeOption: async (id: number | string, payload: any) => {
    return apiRequest(`/master/ppe-options/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deletePpeOption: async (id: number | string) => {
    return apiRequest(`/master/ppe-options/${id}`, {
      method: 'DELETE',
    });
  },

  // 7. Locations
  getLocations: async () => {
    return apiRequest('/master/locations');
  },

  createLocation: async (payload: any) => {
    return apiRequest('/master/locations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateLocation: async (id: number | string, payload: any) => {
    return apiRequest(`/master/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteLocation: async (id: number | string) => {
    return apiRequest(`/master/locations/${id}`, {
      method: 'DELETE',
    });
  },

  // 8. Vendors
  getVendors: async () => {
    return apiRequest('/vendors');
  },

  createVendor: async (payload: any) => {
    return apiRequest('/vendors', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateVendor: async (id: number | string, payload: any) => {
    return apiRequest(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteVendor: async (id: number | string) => {
    return apiRequest(`/vendors/${id}`, {
      method: 'DELETE',
    });
  },

  // 9. Workflow Stages
  getWorkflowStages: async () => {
    return apiRequest('/master/workflow-stages');
  },

  // 10. Monitoring & K3
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
