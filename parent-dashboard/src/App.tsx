import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import type { ReactNode } from 'react';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Children from './pages/Children';
import ChildProfile from './pages/ChildProfile';
import Devices from './pages/Devices';
import AppManagement from './pages/AppManagement';
import Downtime from './pages/Downtime';
import Websites from './pages/Websites';
import Alerts from './pages/Alerts';
import Activity from './pages/Activity';
import Location from './pages/Location';
import Placeholder from './pages/Placeholder';
import ScreenTime from './pages/ScreenTime';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="children" element={<Children />} />
        <Route path="children/:id" element={<ChildProfile />} />
        <Route path="devices" element={<Devices />} />
        <Route path="screen-time" element={<ScreenTime />} />
        <Route path="apps" element={<AppManagement />} />
        <Route path="downtime" element={<Downtime />} />
        <Route path="websites" element={<Websites />} />
        <Route path="location" element={<Location />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="activity" element={<Activity />} />
        <Route path="reports" element={<Placeholder title="Reports" />} />
        <Route path="chat" element={<Placeholder title="Family Chat" />} />
        <Route path="settings" element={<Placeholder title="Settings" />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
