import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { SidebarProvider } from '@/context/SidebarContext';
import { auth } from '@/lib/auth';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import DashboardHSEPage from '@/pages/DashboardHSE';
import DashboardGAPage from '@/pages/DashboardGA';
import CreateRequestPage from '@/pages/CreateRequest';
import MyRequestsPage from '@/pages/MyRequests';
import HistoryPage from '@/pages/History';
import ReviewRequestsPage from '@/pages/ReviewRequests';
import MonitoringHSEPage from '@/pages/MonitoringHSE';
import ProfilePage from '@/pages/Profile';
import MasterDataPage from '@/pages/MasterData';
import PublicQrVerifyPage from '@/pages/PublicQrVerify';
import AparScanPage from '@/pages/AparScanPage';

function ProtectedRoute() {
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="h-screen flex bg-background text-gray-900 overflow-hidden font-sans antialiased relative">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}

function RootDashboard() {
  const role = auth.getRole();
  if (role === 'hse' || role === 'pic_k3') return <DashboardHSEPage />;
  if (role === 'ga_dept_head' || role === 'ga_div_head') return <DashboardGAPage />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-permit/:token" element={<PublicQrVerifyPage />} />
        <Route path="/scan/apar/:code" element={<AparScanPage />} />
        
        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<RootDashboard />} />
          <Route path="create-request" element={<CreateRequestPage />} />
          <Route path="my-requests" element={<MyRequestsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="review" element={<ReviewRequestsPage />} />
          <Route path="monitoring" element={<MonitoringHSEPage />} />
          <Route path="master-data" element={<MasterDataPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Router>
  );
}
