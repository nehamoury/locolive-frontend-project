import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, BrowserRouter as Router, useNavigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SoundProvider } from './context/SoundContext'
import { NetworkProvider } from './context/NetworkContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { OfflineBanner } from './components/ui/OfflineBanner'

// ─── Lazy Loaded Pages ────────────────────────────────────────────────────────
// Auth pages (small, load fast)
const Login = lazy(() => import('./pages/auth/Login'))
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))

// Main app (large — only loaded after login)
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Admin panel (heavy — only loaded for admins)
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const Users = lazy(() => import('./pages/admin/Users'))
const LiveMap = lazy(() => import('./pages/admin/LiveMap'))
const Crossings = lazy(() => import('./pages/admin/Crossings'))
const Reels = lazy(() => import('./pages/admin/Reels'))
const Reports = lazy(() => import('./pages/admin/Reports'))
const Notifications = lazy(() => import('./pages/admin/Notifications'))
const Settings = lazy(() => import('./pages/admin/Settings'))
const Admins = lazy(() => import('./pages/admin/Admins'))
const ActivityPage = lazy(() => import('./pages/admin/Activity'))
const Comments = lazy(() => import('./pages/admin/Comments'))

// ─── Page Loading Fallback ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center relative overflow-hidden">
      {/* Soft background glows */}
      <div className="absolute w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] animate-pulse" />
      
      <div className="flex flex-col items-center gap-6 relative z-10">
        {/* Animated logo/dots */}
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="w-4 h-4 bg-accent rounded-full animate-ping"></div>
        </div>
        
        {/* Text */}
        <div className="flex items-center gap-1">
          <span className="text-primary font-bold tracking-widest text-sm uppercase">Locolive</span>
          <span className="flex gap-1 ml-1">
            <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </span>
        </div>
      </div>
    </div>
  )
}

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
      <Suspense fallback={<PageLoader />}>
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

          {/* Root Redirect */}
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard/home" : "/login"} replace />} 
          />

          {/* Catch-all 404 Route */}
          <Route 
            path="*" 
            element={<NotFound />} 
          />
        </Routes>
      </Suspense>
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
