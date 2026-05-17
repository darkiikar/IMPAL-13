import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { formatRupiah } from '../data/mockData.js'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { label: 'Home',    emoji: '🏠', path: '/home'    },
  { label: 'Makanan', emoji: '🍔', path: '/makanan' },
  { label: 'Laundry', emoji: '🫧', path: '/laundry' },
  { label: 'Top Up',  emoji: '💳', path: '/topup'   },
  { label: 'Profile', emoji: '👤', path: '/profile' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside className={styles.sidebar}>
      <figure className={styles.logo}>
        <img src="/assets/image/Logo.png" alt="Logo Nearify" height="80" />
      </figure>

      <nav className={styles.nav} aria-label="Menu utama">
        {NAV_ITEMS.map(item => (
          <button
            key={item.path}
            className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
            onClick={() => navigate(item.path)}
            aria-current={location.pathname === item.path ? 'page' : undefined}
          >
            <span className={styles.navEmoji}>{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <hr className={styles.divider} />

      <div className={styles.saldo}>
        <p>Saldo</p>
        <strong>💰 Rp {formatRupiah(user?.saldo ?? 0)}</strong>
      </div>

      <hr className={styles.divider} />

      <div className={styles.topupBox}>
        <p>Top Up Saldo</p>
        <button className={styles.topupBtn} onClick={() => navigate('/topup')}>
          Top Up Sekarang
        </button>
      </div>

      <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/') }}>
        🚪 Logout
      </button>
    </aside>
  )
}
