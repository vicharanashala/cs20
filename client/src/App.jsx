import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Nav from './components/Nav';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import GlobalSearch from './components/GlobalSearch';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import FAQPage from './pages/FAQPage';
import FAQEditPage from './pages/FAQEditPage';
import RTQPage from './pages/RTQPage';
import RTQDetailPage from './pages/RTQDetailPage';
import StudentDashboard from './pages/StudentDashboard';
import SeniorDashboard from './pages/SeniorDashboard';
import AddFAQPage from './pages/AddFAQPage';
import RaiseQuestionPage from './pages/RaiseQuestionPage';
import ProfilePage from './pages/ProfilePage';
import UserListPage from './pages/UserListPage';
import UserProfilePage from './pages/UserProfilePage';
import TrackQuestionPage from './pages/TrackQuestionPage';
import WorkingHistoryPage from './pages/WorkingHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import QPHistoryPage from './pages/QPHistoryPage';
import AboutPage from './pages/AboutPage';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center animate-pulse">
          <span className="text-white font-brand font-bold text-lg">P</span>
        </div>
        <div className="text-muted text-sm font-medium">Loading...</div>
      </div>
    </div>
  );
}

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

function DashboardRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'senior' || user.role === 'admin') return <SeniorDashboard />;
  return <StudentDashboard />;
}


// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppLayout() {
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <ScrollToTop />
      {user && !['/login', '/signup'].includes(location.pathname) && <Nav refreshUser={refreshUser} />}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <div key={location.pathname} className="page-enter">
        <Routes>
          <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq/edit/:id" element={<ProtectedRoute allowedRoles={['senior', 'admin']}><FAQEditPage /></ProtectedRoute>} />
          <Route path="/rtq" element={<ProtectedRoute><RTQPage /></ProtectedRoute>} />
          <Route path="/rtq/:id" element={<ProtectedRoute><RTQDetailPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UserListPage /></ProtectedRoute>} />
          <Route path="/users/:id" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
          <Route path="/track" element={<ProtectedRoute allowedRoles={['student', 'moderator']}><TrackQuestionPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><WorkingHistoryPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/qp-history" element={<ProtectedRoute><QPHistoryPage /></ProtectedRoute>} />
          <Route path="/raise-question" element={<ProtectedRoute allowedRoles={['student', 'moderator']}><RaiseQuestionPage /></ProtectedRoute>} />
          <Route path="/add-faq" element={<ProtectedRoute allowedRoles={['senior', 'admin']}><AddFAQPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/faq" replace />} />
          <Route path="*" element={<Navigate to="/faq" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppLayout />
      </ToastProvider>
    </ErrorBoundary>
  );
}
