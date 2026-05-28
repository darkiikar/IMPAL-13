import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthCallback() {
  const navigate  = useNavigate()
  const { loginWithToken } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')
    const error  = params.get('error')

    if (error || !token) {
      navigate('/login?error=google_failed', { replace: true })
      return
    }

    loginWithToken(token).then((user) => {
      if (!user) {
        navigate('/login?error=fetch_failed', { replace: true })
        return
      }
      navigate(user.role === 'admin' ? '/admin' : '/home', { replace: true })
    })
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: '1rem',
      background: 'var(--bg, #0f0f0f)', color: 'white',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        width: 48, height: 48,
        border: '4px solid rgba(255,255,255,0.1)',
        borderTop: '4px solid #19e5ea',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
        Masuk dengan Google…
      </p>
    </div>
  )
}
