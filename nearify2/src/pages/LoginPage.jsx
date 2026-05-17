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
      </form>

      <p className={styles.switchText}>
        Don't have an account?{' '}
        <Link to="/signup" className={styles.switchLink}>Sign up</Link>
      </p>
    </AuthLayout>
  )
}
