import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Nav from './components/Nav';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import FAQPage from './pages/FAQPage';
import RTQPage from './pages/RTQPage';
import StudentDashboard from './pages/StudentDashboard';
import SeniorDashboard from './pages/SeniorDashboard';
import AddFAQPage from './pages/AddFAQPage';
import RaiseQuestionPage from './pages/RaiseQuestionPage';
import ProfilePage from './pages/ProfilePage';
import UserListPage from './pages/UserListPage';
import TrackQuestionPage from './pages/TrackQuestionPage';
import WorkingHistoryPage from './pages/WorkingHistoryPage';
import NotificationsPage from './pages/NotificationsPage';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-muted">Loading...</div>
    </div>
  );
}

// FIX #8: ProtectedRoute no longer wraps <AppRoutes> — each route renders its page directly
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// FIX #17: Dashboard renders correct page based on role
function DashboardRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'senior' || user.role === 'admin') return <SeniorDashboard />;
  return <StudentDashboard />;
}

const PUBLIC_PATHS = ['/login', '/signup'];

export default function App() {
  const location = useLocation();
  const { user } = useAuth();
  const isPublic = PUBLIC_PATHS.includes(location.pathname);

  return (
    <div className="min-h-screen bg-surface">
      {/* FIX #16: Show Nav on all authenticated pages */}
      {user && !isPublic && <Nav />}
      <Routes>
        {/* Public */}
        <Route path="/login"  element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />

        {/* Dashboard — role-aware (FIX #17) */}
        <Route path="/dashboard" element={<DashboardRoute />} />

        {/* Protected — all authenticated users */}
        <Route path="/faq"           element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />
        <Route path="/rtq"           element={<ProtectedRoute><RTQPage /></ProtectedRoute>} />
        <Route path="/profile"       element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/users"         element={<ProtectedRoute><UserListPage /></ProtectedRoute>} />
        <Route path="/track"         element={<ProtectedRoute><TrackQuestionPage /></ProtectedRoute>} />
        <Route path="/history"       element={<ProtectedRoute><WorkingHistoryPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        {/* Role-restricted */}
        <Route path="/raise-question" element={<ProtectedRoute allowedRoles={['student', 'moderator']}><RaiseQuestionPage /></ProtectedRoute>} />
        <Route path="/add-faq"        element={<ProtectedRoute allowedRoles={['senior', 'admin']}><AddFAQPage /></ProtectedRoute>} />

        {/* Redirects */}
        <Route path="/"  element={<Navigate to="/login" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}
