import { auth } from '@/lib/auth';

// API Base URL from env or dynamic hostname (supports localhost and mobile LAN access)
export const API_BASE_URL = 
  (import.meta as any).env?.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
    : 'http://localhost:8000/api/v1');

// Helper for authenticated fetch
export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = auth.getToken();
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
      if (res.status === 401 && !endpoint.includes('/auth/login')) {
        auth.clearSession();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || 'Request failed with status ' + res.status);
    }
    return data;
  } catch (err: any) {
    console.warn(`[API] Call to ${endpoint} failed, falling back if available:`, err.message);
    throw err;
  }
}

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

  updateProfile: async (payload: any) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
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

  getPermitHistory: async () => {
    return apiRequest('/permits/history');
  },

  getPermitDetail: async (id: string | number) => {
    return apiRequest(`/permits/${id}`);
  },

  checkExtendEligibility: async (id: string | number) => {
    return apiRequest(`/permits/${id}/extend`);
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

  updatePermitTypePpes: async (id: number | string, ppeIds: number[]) => {
    return apiRequest(`/master/permit-types/${id}/ppes`, {
      method: 'PUT',
      body: JSON.stringify({ ppe_ids: ppeIds }),
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

  // 9b. System & Policy Settings (SIKA Rules)
  getSettings: async (group?: string) => {
    return apiRequest(`/master/settings${group ? '?group=' + group : ''}`);
  },

  updateSettings: async (settings: Array<{ key: string; value: any }>) => {
    return apiRequest('/master/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  },

  // 10. Monitoring & K3
  getFacilities: async (category?: string, tipe_item?: string, search?: string, area_zone?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (tipe_item) params.append('tipe_item', tipe_item);
    if (search) params.append('search', search);
    if (area_zone) params.append('area_zone', area_zone);
    const qs = params.toString();
    return apiRequest(`/monitoring/facilities${qs ? '?' + qs : ''}`);
  },

  getFacilityInspections: async (id: number | string) => {
    return apiRequest(`/monitoring/facilities/${id}/inspections`);
  },

  getAllInspections: async (params?: {
    category?: string;
    area_zone?: string;
    check_status?: string;
    verification_status?: string;
    result_status?: string;
    date_range?: string;
    search?: string;
    sort_by?: string;
    page?: number;
    per_page?: number;
  }) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== 'ALL' && val !== 'all' && val !== '') {
          q.append(key, String(val));
        }
      });
    }
    const qs = q.toString();
    return apiRequest(`/monitoring/inspections${qs ? '?' + qs : ''}`);
  },

  getAparByScanCode: async (code: string) => {
    return apiRequest(`/monitoring/scan/${encodeURIComponent(code)}`);
  },

  submitPetugasInspection: async (code: string, payload: {
    inspector_name: string;
    notes: string;
    tbg: boolean;
    slg: boolean;
    nozz: boolean;
    sgl: boolean;
    lev: boolean;
    foto_bukti?: string;
  }) => {
    return apiRequest(`/monitoring/scan/${encodeURIComponent(code)}/petugas`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  submitPicVerification: async (code: string, payload: {
    pic_name: string;
    verification_status: 'VERIFIED' | 'REVISE' | 'REFILL_REQUESTED';
    verification_notes?: string;
  }) => {
    return apiRequest(`/monitoring/scan/${encodeURIComponent(code)}/pic`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getRefillSummary: async () => {
    return apiRequest('/monitoring/refill-summary');
  },

  getFacilityByQrId: async (qrCodeId: string) => {
    return apiRequest(`/monitoring/facilities/by-qr/${encodeURIComponent(qrCodeId)}`);
  },

  recordRefill: async (facilityId: number | string, payload: any) => {
    return apiRequest(`/monitoring/facilities/${facilityId}/refill`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getAlertsSummary: async () => {
    return apiRequest('/monitoring/alerts-summary');
  },

  createFacility: async (payload: any) => {
    return apiRequest('/monitoring/facilities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  submitInspection: async (payload: any) => {
    return apiRequest('/monitoring/inspections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  submitCapa: async (payload: any) => {
    return apiRequest('/monitoring/capa', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  closeCapa: async (id: number | string, notes?: string) => {
    return apiRequest(`/monitoring/capa/${id}/close`, {
      method: 'PUT',
      body: JSON.stringify({ close_notes: notes }),
    });
  },

  getSpiMetrics: async () => {
    return apiRequest('/monitoring/spi-metrics');
  },

  // 11. Real Role Dashboards
  getContractorDashboard: async (params?: { period?: string }) => {
    const query = params?.period ? `?period=${encodeURIComponent(params.period)}` : '';
    return apiRequest(`/dashboard/contractor${query}`);
  },

  getHseDashboard: async () => {
    return apiRequest('/dashboard/hse');
  },

  getGaDashboard: async () => {
    return apiRequest('/dashboard/ga');
  },
};

export interface ConsumableCycle {
  id?: number;
  facility_id?: number;
  expired_at: string;
  threshold_warning_hari: number;
  status_exp?: string;
  terakhir_refill_at?: string;
}

export interface ConditionSchedule {
  id?: number;
  facility_id?: number;
  interval_pemeriksaan_hari: number;
  terakhir_diperiksa_at?: string;
  jadwal_berikutnya_at?: string;
  status_kondisi_terakhir?: string;
}

export interface SafetyFacility {
  id: number;
  code: string;
  qr_code_id?: string;
  nama_item?: string;
  name?: string;
  category: string;
  tipe_item: 'CONSUMABLE' | 'KONDISI';
  area_zone?: string;
  location: any;
  specifications?: any;
  status: string;
  status_aktif?: boolean;
  calculated_status?: string;
  days_until_expired?: number | null;
  is_overdue?: boolean;
  last_inspected_at?: string;
  consumable_cycle?: ConsumableCycle;
  condition_schedule?: ConditionSchedule;
  refill_histories?: any[];
  inspections?: any[];
}

export interface AlertsSummary {
  consumable: {
    total: number;
    aman: number;
    h30: number;
    kadaluarsa: number;
  };
  kondisi: {
    total: number;
    baik: number;
    perhatian: number;
    perlu_perhatian?: number;
    rusak: number;
    terlewat: number;
    jadwal_terlewat?: number;
  };
  alerts: any[];
}

