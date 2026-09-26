import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute';
import TabNav from './components/layout/TabNav';
import MobileNav from './components/layout/MobileNav';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ShipmentsPage from './pages/ShipmentsPage';
import ShipmentDetailPage from './pages/ShipmentDetailPage';
import DevicesPage from './pages/DevicesPage';
import AlertsPage from './pages/AlertsPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogPage from './pages/AuditLogPage';

/** Shared layout: sidebar + main content area */
function AppLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0f1e] mesh-bg">
      {/* Desktop Sidebar */}
      <TabNav />
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
          {children}
        </div>
      </main>
      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout><DashboardPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/shipments" element={
            <ProtectedRoute>
              <AppLayout><ShipmentsPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/shipments/:id" element={
            <ProtectedRoute>
              <AppLayout><ShipmentDetailPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/devices" element={
            <ProtectedRoute>
              <AppLayout><DevicesPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/alerts" element={
            <ProtectedRoute>
              <AppLayout><AlertsPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <AppLayout><ReportsPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/audit-log" element={
            <ProtectedRoute>
              <AppLayout><AuditLogPage /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
