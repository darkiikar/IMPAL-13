import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout  from '../components/AuthLayout.jsx'
import FormField   from '../components/FormField.jsx'
import { useForm } from '../hooks/useForm.js'
import { useAuth } from '../context/AuthContext.jsx'
import { MOCK_USERS } from '../data/mockData.js'
import styles from './AuthPage.module.css'

function validate(values) {
  const errors = {}
  if (!values.email?.trim()) errors.email = 'Email wajib diisi.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Format email tidak valid.'
  if (!values.password) errors.password = 'Password wajib diisi.'
  else if (values.password.length < 6) errors.password = 'Password minimal 6 karakter.'
  return errors
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [serverError, setServerError] = useState('')

  const { values, errors, touched, loading, handleChange, handleBlur, handleSubmit } =
    useForm({ email: '', password: '', remember: false }, validate)

  const onSubmit = async (vals) => {
    setServerError('')
    await new Promise(r => setTimeout(r, 500))
    const found = MOCK_USERS.find(
      u => u.email === vals.email.trim().toLowerCase() && u.password === vals.password
    )
    if (!found) { setServerError('Email atau password salah.'); return }
    login(found, vals.remember)
    navigate(found.role === 'admin' ? '/admin' : '/home', { replace: true })
  }

  return (
    <AuthLayout title="Log in" greeting={<>Hello there!<br />Welcome back</>}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <FormField label="Email Address" id="email" name="email" type="email"
          placeholder="Your E-mail Address" value={values.email}
          onChange={handleChange} onBlur={handleBlur}
          error={touched.email && errors.email} autoComplete="email" />

        <FormField label="Password" id="password" name="password" type="password"
          placeholder="••••••••" value={values.password}
          onChange={handleChange} onBlur={handleBlur}
          error={touched.password && errors.password} autoComplete="current-password" />

        <div className={styles.checkboxRow}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="remember" checked={values.remember} onChange={handleChange} />
            <span>Remember me</span>
          </label>
        </div>

        {serverError && <p className={styles.serverError} role="alert">{serverError}</p>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Masuk...' : 'Login'}
        </button>

        <div className={styles.divider}>
          <span>atau</span>
        </div>

        <a
          href="http://localhost:8000/auth/google"
          className={styles.googleBtn}
          id="btn-login-google"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Masuk dengan Google
        </a>
      </form>

      <p className={styles.switchText}>
        Don't have an account?{' '}
        <Link to="/signup" className={styles.switchLink}>Sign up</Link>
      </p>
    </AuthLayout>
  )
}
