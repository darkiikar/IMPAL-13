import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './SplashPage.module.css'

export default function SplashPage() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  // Fade-in animasi saat halaman pertama dimuat
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <main className={styles.container}>
      {/* LEFT */}
      <section className={`${styles.leftSection} ${visible ? styles.fadeIn : ''}`}>
        <img
          src="/assets/image/Logo.png"
          alt="Logo Nearify"
          className={styles.logo}
        />
        <p className={styles.tagline}>Tempatnya Mahasiswa</p>
        <img
          src="/assets/image/loading.png"
          alt="Loading"
          className={styles.loadingIcon}
        />
      </section>

      {/* RIGHT */}
      <section className={`${styles.rightSection} ${visible ? styles.fadeInDelay : ''}`}>
        <h1 className={styles.title}>Selamat Datang di Nearify</h1>
        <p className={styles.subtitle}>
          Temukan makanan dan laundry lebih mudah bersama Nearify.
        </p>

        <button
          className={styles.loginBtn}
          onClick={() => navigate('/login')}
        >
          Login
        </button>

        <button
          className={styles.signupBtn}
          onClick={() => navigate('/signup')}
        >
          Sign Up
        </button>

        <p className={styles.version}>V 1.00</p>
      </section>
    </main>
  )
}
