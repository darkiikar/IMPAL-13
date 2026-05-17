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
  if (!values.name?.trim()) errors.name = 'Nama wajib diisi.'
  if (!values.email?.trim()) errors.email = 'Email wajib diisi.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Format email tidak valid.'
  if (!values.password) errors.password = 'Password wajib diisi.'
  else if (values.password.length < 6) errors.password = 'Password minimal 6 karakter.'
  if (!values.confirmPassword) errors.confirmPassword = 'Konfirmasi password wajib diisi.'
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'Password tidak cocok.'
  return errors
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [serverError, setServerError] = useState('')

  const { values, errors, touched, loading, handleChange, handleBlur, handleSubmit } =
    useForm({ name: '', email: '', password: '', confirmPassword: '', remember: false }, validate)

  const onSubmit = async (vals) => {
    setServerError('')
    await new Promise(r => setTimeout(r, 500))
    const exists = MOCK_USERS.find(u => u.email === vals.email.trim().toLowerCase())
    if (exists) { setServerError('Email sudah terdaftar. Silakan login.'); return }
    const newUser = {
      id: Date.now(), name: vals.name.trim(),
      email: vals.email.trim().toLowerCase(),
      saldo: 0, role: 'user',
    }
    login(newUser, vals.remember)
    navigate('/home', { replace: true })
  }

  return (
    <AuthLayout title="Sign Up" greeting={<>Hello there!<br />Welcome to Nearify.</>}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <FormField label="Nama Lengkap" id="name" name="name" type="text"
          placeholder="Nama kamu" value={values.name}
          onChange={handleChange} onBlur={handleBlur}
          error={touched.name && errors.name} autoComplete="name" />

        <FormField label="Email Address" id="email" name="email" type="email"
          placeholder="Your E-mail Address" value={values.email}
          onChange={handleChange} onBlur={handleBlur}
          error={touched.email && errors.email} autoComplete="email" />

        <FormField label="Password" id="password" name="password" type="password"
          placeholder="••••••••" value={values.password}
          onChange={handleChange} onBlur={handleBlur}
          error={touched.password && errors.password} autoComplete="new-password" />

        <FormField label="Confirm Password" id="confirmPassword" name="confirmPassword" type="password"
          placeholder="••••••••" value={values.confirmPassword}
          onChange={handleChange} onBlur={handleBlur}
          error={touched.confirmPassword && errors.confirmPassword} autoComplete="new-password" />

        <div className={styles.checkboxRow}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="remember" checked={values.remember} onChange={handleChange} />
            <span>Remember me</span>
          </label>
        </div>

        {serverError && <p className={styles.serverError} role="alert">{serverError}</p>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Mendaftar...' : 'Sign Up'}
        </button>
      </form>

      <p className={styles.switchText}>
        Already have an account?{' '}
        <Link to="/login" className={styles.switchLink}>Log in</Link>
      </p>
    </AuthLayout>
  )
}
