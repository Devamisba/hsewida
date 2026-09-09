// Mock data for dashboard
export const MOCK_DASHBOARD_METRICS = {
  activePermits: 42,
  safeWorkHours: 12500,
  nearMissReports: 3,
};

export const MOCK_FACILITY_STATUS = [
  { id: 1, name: "APAR (Fire Extinguisher)", status: "Good", lastChecked: "2023-10-25" },
  { id: 2, name: "Hydrant Monitoring", status: "Needs Attention", lastChecked: "2023-10-20" },
  { id: 3, name: "Emergency Door", status: "Good", lastChecked: "2023-10-25" },
  { id: 4, name: "P3K (First Aid Kit)", status: "Expired", lastChecked: "2023-09-15" },
  { id: 5, name: "Safety Mirror", status: "Good", lastChecked: "2023-10-25" },
  { id: 6, name: "Assembly Point", status: "Good", lastChecked: "2023-10-25" },
];

export const MOCK_CHART_DATA = [
  { name: "Week 1", incidents: 2, nearMiss: 1, safeDays: 5 },
  { name: "Week 2", incidents: 0, nearMiss: 2, safeDays: 7 },
  { name: "Week 3", incidents: 1, nearMiss: 0, safeDays: 6 },
  { name: "Week 4", incidents: 0, nearMiss: 0, safeDays: 7 },
];

// Mock API calls to be replaced with real endpoints later
export const api = {
  submitWorkPermit: async (payload: any) => {
    console.log("Mock API: Submitting Work Permit Data:", payload);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: "Permit submitted successfully" });
      }, 1000); // simulate network delay
    });
  },
  
  getDashboardData: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          metrics: MOCK_DASHBOARD_METRICS,
          facilities: MOCK_FACILITY_STATUS,
          chartData: MOCK_CHART_DATA
        });
      }, 800);
    });
  },

  updateFacilityStatus: async (facilityId: number, newStatus: string) => {
    console.log(`Mock API: Updating facility ${facilityId} to ${newStatus}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  }
};
