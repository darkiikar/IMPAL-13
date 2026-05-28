import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import SplashPage  from './pages/SplashPage.jsx'
import LoginPage   from './pages/LoginPage.jsx'
import SignupPage  from './pages/SignupPage.jsx'
import HomePage    from './pages/HomePage.jsx'
import MakananPage from './pages/MakananPage/MakananPage.jsx'
import LaundryPage from './pages/LaundryPage/LaundryPage.jsx'
import TopUpPage   from './pages/TopUpPage/TopUpPage.jsx'
import ProfilePage from './pages/ProfilePage/ProfilePage.jsx'
import AdminPage   from './pages/AdminPage/AdminPage.jsx'
import AuthCallback from './pages/AuthCallback.jsx'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return children
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/home" replace />
  return children
}

function GuestRoute({ children }) {
  const { user } = useAuth()
  if (!user) return children
  return <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"        element={<GuestRoute><SplashPage /></GuestRoute>} />
      <Route path="/login"   element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/signup"  element={<GuestRoute><SignupPage /></GuestRoute>} />
      <Route path="/home"    element={<PrivateRoute><HomePage /></PrivateRoute>} />
      <Route path="/makanan" element={<PrivateRoute><MakananPage /></PrivateRoute>} />
      <Route path="/laundry" element={<PrivateRoute><LaundryPage /></PrivateRoute>} />
      <Route path="/topup"   element={<PrivateRoute><TopUpPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/admin"         element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*"              element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
