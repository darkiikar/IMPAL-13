import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar.jsx'
import Topbar  from '../../components/Topbar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useForm } from '../../hooks/useForm.js'
import { formatRupiah, MOCK_USERS } from '../../data/mockData.js'
import styles from './ProfilePage.module.css'

const TABS = ['Profil', 'Riwayat Order', 'Keamanan']

// ── validasi ──
function validateProfile(v) {
  const e = {}
  if (!v.name?.trim())  e.name  = 'Nama wajib diisi.'
  if (!v.email?.trim()) e.email = 'Email wajib diisi.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Format email tidak valid.'
  return e
}
function validatePassword(v) {
  const e = {}
  if (!v.currentPassword) e.currentPassword = 'Password lama wajib diisi.'
  if (!v.newPassword)     e.newPassword     = 'Password baru wajib diisi.'
  else if (v.newPassword.length < 6) e.newPassword = 'Minimal 6 karakter.'
  if (v.confirmNew !== v.newPassword) e.confirmNew = 'Password tidak cocok.'
  return e
}

// ── Tab Profil ──
function TabProfil() {
  const { user, updateUser } = useAuth()
  const [saved, setSaved]   = useState(false)
  const [avatarErr, setAvatarErr] = useState('')
  const fileRef = useRef(null)

  const { values, errors, touched, loading, handleChange, handleBlur, handleSubmit } =
    useForm({ name: user?.name ?? '', email: user?.email ?? '' }, validateProfile)

  const onSubmit = async (vals) => {
    await new Promise(r => setTimeout(r, 500))
    updateUser({ name: vals.name.trim(), email: vals.email.trim().toLowerCase() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleAvatarChange = (e) => {
    setAvatarErr('')
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setAvatarErr('File harus berupa gambar.'); return }
    if (file.size > 5 * 1024 * 1024)    { setAvatarErr('Ukuran foto maksimal 5MB.');  return }
    const reader = new FileReader()
    reader.onload = (ev) => { updateUser({ avatar: ev.target.result }) }
    reader.onerror = ()  => { setAvatarErr('Gagal membaca file. Coba lagi.') }
    reader.readAsDataURL(file)
  }

  const removeAvatar = () => {
    updateUser({ avatar: null })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className={styles.tabContent}>
      {/* Avatar */}
      <div className={styles.avatarSection}>
        <div className={styles.avatarWrap}>
          {user?.avatar
            ? <img src={user.avatar} alt="Foto profil" className={styles.bigAvatarImg} />
            : <div className={styles.bigAvatar}>{(user?.name?.[0] ?? 'U').toUpperCase()}</div>
          }
          <button className={styles.editAvatarBtn} onClick={() => fileRef.current?.click()} type="button" title="Ganti foto">📷</button>
        </div>
        <div>
          <h3>{user?.name}</h3>
          <p>{user?.email}</p>
          <div className={styles.avatarBtns}>
            <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()} type="button">
              Ganti Foto
            </button>
            {user?.avatar && (
              <button className={styles.removeBtn} onClick={removeAvatar} type="button">Hapus Foto</button>
            )}
          </div>
          {avatarErr && <p className={styles.err}>{avatarErr}</p>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className={styles.hiddenInput} onChange={handleAvatarChange} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.field}>
          <label>Nama Lengkap</label>
          <input name="name" value={values.name} onChange={handleChange} onBlur={handleBlur}
            maxLength={50} className={`${styles.input} ${touched.name && errors.name ? styles.inputError : ''}`} />
          {touched.name && errors.name && <span className={styles.err}>{errors.name}</span>}
        </div>
        <div className={styles.field}>
          <label>Email</label>
          <input name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur}
            maxLength={100} className={`${styles.input} ${touched.email && errors.email ? styles.inputError : ''}`} />
          {touched.email && errors.email && <span className={styles.err}>{errors.email}</span>}
        </div>
        {saved && <p className={styles.savedMsg}>✅ Profil berhasil disimpan!</p>}
        <button type="submit" className={styles.saveBtn} disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  )
}

// ── Tab Riwayat ──
function TabRiwayat() {
  const { userOrders } = useAuth()

  if (!userOrders || userOrders.length === 0) {
    return (
      <div className={styles.empty}>
        <span>📋</span><p>Belum ada riwayat pesanan</p>
      </div>
    )
  }

  return (
    <div className={styles.tabContent}>
      {userOrders.map(order => (
        <div key={order.id} className={styles.orderCard}>
          <div className={styles.orderTop}>
            <div>
              <span className={`${styles.orderBadge} ${order.type === 'makanan' ? styles.badgeFood : styles.badgeLaundry}`}>
                {order.type === 'makanan' ? '🍔 Makanan' : '🫧 Laundry'}
              </span>
              <h4>{order.type === 'makanan' ? order.warungName : order.laundryName}</h4>
              <small>{new Date(order.createdAt).toLocaleString('id-ID')}</small>
            </div>
            <div className={styles.orderTotal}>
              <span>Total</span>
              <strong>Rp {formatRupiah(order.total)}</strong>
            </div>
          </div>

          {order.type === 'makanan' && order.items?.length > 0 && (
            <div className={styles.orderItems}>
              {order.items.map((item, i) => <span key={i}>{item.name} x{item.qty}</span>)}
            </div>
          )}
          {order.type === 'laundry' && (
            <div className={styles.orderItems}>
              <span>{order.service} · {order.durasi} · {order.berat} kg</span>
              {order.estimasiSelesai && <span>Estimasi: {order.estimasiSelesai}</span>}
            </div>
          )}

          <div className={styles.orderStatus}>
            <span className={styles.statusBadge} data-status={order.status}>{order.status}</span>
          </div>

          {/* Pesan dari admin */}
          {order.messages?.length > 0 && (
            <div className={styles.messagesList}>
              {order.messages.map((msg, i) => (
                <div key={i} className={styles.adminMsg}>
                  <span>📢 Admin:</span> {msg.text}
                  <small>{new Date(msg.time).toLocaleString('id-ID')}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Tab Keamanan ──
function TabKeamanan() {
  const { user } = useAuth()
  const [saved,       setSaved]       = useState(false)
  const [serverError, setServerError] = useState('')

  const { values, errors, touched, loading, handleChange, handleBlur, handleSubmit, reset } =
    useForm({ currentPassword: '', newPassword: '', confirmNew: '' }, validatePassword)

  const onSubmit = async (vals) => {
    setServerError('')
    await new Promise(r => setTimeout(r, 600))
    // Cek password lama dari mock data
    const found = MOCK_USERS.find(u => u.email === user?.email && u.password === vals.currentPassword)
    // Kalau bukan dari mock (user signup baru), skip cek — backend yang handle
    if (MOCK_USERS.some(u => u.email === user?.email) && !found) {
      setServerError('Password lama salah.')
      return
    }
    reset()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const fields = [
    { name: 'currentPassword', label: 'Password Lama',            autoComplete: 'current-password' },
    { name: 'newPassword',     label: 'Password Baru',            autoComplete: 'new-password' },
    { name: 'confirmNew',      label: 'Konfirmasi Password Baru', autoComplete: 'new-password' },
  ]

  return (
    <div className={styles.tabContent}>
      <h3 className={styles.secTitle}>Ganti Password</h3>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {fields.map(f => (
          <div key={f.name} className={styles.field}>
            <label>{f.label}</label>
            <input name={f.name} type="password" placeholder="••••••••"
              value={values[f.name]} onChange={handleChange} onBlur={handleBlur}
              autoComplete={f.autoComplete} maxLength={100}
              className={`${styles.input} ${touched[f.name] && errors[f.name] ? styles.inputError : ''}`} />
            {touched[f.name] && errors[f.name] && <span className={styles.err}>{errors[f.name]}</span>}
          </div>
        ))}
        {serverError && <p className={styles.err}>{serverError}</p>}
        {saved       && <p className={styles.savedMsg}>✅ Password berhasil diubah!</p>}
        <button type="submit" className={styles.saveBtn} disabled={loading}>
          {loading ? 'Menyimpan...' : 'Ubah Password'}
        </button>
      </form>
    </div>
  )
}

// ── Halaman utama Profile ──
export default function ProfilePage() {
  const { user, logout }  = useAuth()
  const navigate          = useNavigate()
  const [activeTab, setActiveTab] = useState(0)

  if (!user) { navigate('/login', { replace: true }); return null }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Topbar />

        <div className={styles.pageHeader}>
          <h1>👤 Profile</h1>
          <p>Kelola informasi akun kamu</p>
        </div>

        <div className={styles.saldoCard}>
          <div>
            <span>Saldo Nearify</span>
            <h3>Rp {formatRupiah(user?.saldo ?? 0)}</h3>
          </div>
          <button onClick={() => navigate('/topup')}>+ Top Up</button>
        </div>

        <div className={styles.tabs}>
          {TABS.map((tab, i) => (
            <button key={tab}
              className={`${styles.tab} ${activeTab === i ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(i)}>
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.tabPanel}>
          {activeTab === 0 && <TabProfil />}
          {activeTab === 1 && <TabRiwayat />}
          {activeTab === 2 && <TabKeamanan />}
        </div>

        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/') }}>
          🚪 Logout dari akun ini
        </button>
      </main>
    </div>
  )
}
