import { Routes, Route, Navigate, BrowserRouter as Router, useNavigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SoundProvider } from './context/SoundContext'
import { NetworkProvider } from './context/NetworkContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import Login from './pages/auth/Login'
import AdminLogin from './pages/auth/AdminLogin'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Dashboard from './pages/dashboard/Dashboard'
import { OfflineBanner } from './components/ui/OfflineBanner'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import Users from './pages/admin/Users'
import LiveMap from './pages/admin/LiveMap'
import Crossings from './pages/admin/Crossings'
import Reels from './pages/admin/Reels'
import Reports from './pages/admin/Reports'
import Notifications from './pages/admin/Notifications'
import Settings from './pages/admin/Settings'
import Admins from './pages/admin/Admins'
import ActivityPage from './pages/admin/Activity'
import Comments from './pages/admin/Comments'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 120000, // 2 minutes
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';


  return (
    <>
      <OfflineBanner />
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!user ? <Login onToggle={() => navigate('/signup')} onBack={() => navigate('/')} /> : <Navigate to="/dashboard/home" replace />} 
        />


        <Route 
          path="/admin/login" 
          element={!isAdmin ? <AdminLogin /> : <Navigate to="/admin" replace />} 
        />

        <Route 
          path="/signup" 
          element={!user ? <Signup onToggle={() => navigate('/login')} onBack={() => navigate('/login')} /> : <Navigate to="/dashboard/home" replace />} 
        />

        <Route 
          path="/forgot-password" 
          element={!user ? <ForgotPassword onBack={() => navigate('/login')} /> : <Navigate to="/dashboard/home" replace />} 
        />

        <Route 
          path="/reset-password" 
          element={!user ? <ResetPassword /> : <Navigate to="/dashboard/home" replace />} 
        />



        {/* Protected Dashboard Route (Layout) */}
        <Route 
          path="/dashboard/*" 
          element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
        />

        {/* Admin Routes (Protected + Role Check) */}
        <Route 
          path="/admin" 
          element={
            !user ? (
              <Navigate to="/admin/login" replace />
            ) : isAdmin ? (
              <AdminLayout />
            ) : (
              <Navigate to="/admin/login" replace />
            )

          } 
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="map" element={<LiveMap />} />
          <Route path="crossings" element={<Crossings />} />
          <Route path="reels" element={<Reels />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admins" element={<Admins />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="comments" element={<Comments />} />
        </Route>

        {/* Catch-all Redirect */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard/home" : "/login"} replace />} 
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SoundProvider>
              <NetworkProvider>
                <AppContent />
              </NetworkProvider>
            </SoundProvider>
          </AuthProvider>
        </ThemeProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </Router>
  );
}

export default App;
