import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './Topbar.module.css'

export default function Topbar({ searchQuery = '', onSearchChange }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <header className={styles.topbar}>
      <div className={styles.greeting}>
        <h1>Hai, {user?.name ?? 'Pengguna'}!</h1>
        <p>Selamat datang kembali di Nearify</p>
      </div>

      {onSearchChange && (
        <search className={styles.search}>
          <span aria-hidden="true">🔍</span>
          <input
            id="searchInput"
            type="search"
            placeholder="Cari makanan atau laundry..."
            aria-label="Cari makanan atau laundry"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            maxLength={100}
          />
          {searchQuery && (
            <button className={styles.clearBtn} onClick={() => onSearchChange('')}
              aria-label="Hapus pencarian" type="button">✕</button>
          )}
        </search>
      )}

      <div className={styles.right}>
        {/* Avatar klik → profile */}
        <button
          className={styles.avatar}
          aria-label="Ke halaman profil"
          onClick={() => navigate('/profile')}
          type="button"
          title={user?.name}
        >
          {user?.avatar
            ? <img src={user.avatar} alt="avatar" className={styles.avatarImg} />
            : (user?.name?.[0] ?? 'U').toUpperCase()
          }
        </button>
      </div>
    </header>
  )
}
