// v1.1.0 - Updated with Render backend integration
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOwners from './pages/admin/AdminOwners';
import AdminTenants from './pages/admin/AdminTenants';
import AdminReports from './pages/admin/AdminReports';
import AdminMeters from './pages/admin/AdminMeters';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import TenantManagement from './pages/owner/TenantManagement';
import MeterManagement from './pages/owner/MeterManagement';
import OwnerReports from './pages/owner/OwnerReports';
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantReports from './pages/tenant/TenantReports';
import SettingsPage from './pages/shared/SettingsPage';

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/owners" element={<ProtectedRoute roles={['admin']}><AdminOwners /></ProtectedRoute>} />
            <Route path="/admin/tenants" element={<ProtectedRoute roles={['admin']}><AdminTenants /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/meters" element={<ProtectedRoute roles={['admin']}><AdminMeters /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><SettingsPage /></ProtectedRoute>} />

            {/* Owner routes */}
            <Route path="/owner" element={<ProtectedRoute roles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/owner/tenants" element={<ProtectedRoute roles={['owner']}><TenantManagement /></ProtectedRoute>} />
            <Route path="/owner/meters" element={<ProtectedRoute roles={['owner']}><MeterManagement /></ProtectedRoute>} />
            <Route path="/owner/meter-requests" element={<ProtectedRoute roles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/owner/reports" element={<ProtectedRoute roles={['owner']}><OwnerReports /></ProtectedRoute>} />
            <Route path="/owner/settings" element={<ProtectedRoute roles={['owner']}><SettingsPage /></ProtectedRoute>} />

            {/* Tenant routes */}
            <Route path="/tenant" element={<ProtectedRoute roles={['tenant']}><TenantDashboard /></ProtectedRoute>} />
            <Route path="/tenant/meter-request" element={<ProtectedRoute roles={['tenant']}><TenantDashboard /></ProtectedRoute>} />
            <Route path="/tenant/reports" element={<ProtectedRoute roles={['tenant']}><TenantReports /></ProtectedRoute>} />
            <Route path="/tenant/settings" element={<ProtectedRoute roles={['tenant']}><SettingsPage /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  </BrowserRouter>
);

export default App;
