import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatRupiah, ORDER_STATUSES } from '../../data/mockData.js'
import styles from './AdminPage.module.css'

function StatusBadge({ status }) {
  return <span className={styles.statusBadge} data-status={status}>{status}</span>
}

function OrderCard({ order, onUpdateStatus }) {
  const [showMsgBox, setShowMsgBox] = useState(false)
  const [msg,        setMsg]        = useState('')
  const [selStatus,  setSelStatus]  = useState(order.status)

  const handleSend = () => {
    if (!selStatus) return
    const message = msg.trim()
    onUpdateStatus(order.id, selStatus, message)
    setMsg('')
    setShowMsgBox(false)
  }

  return (
    <div className={styles.orderCard}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div>
          <span className={`${styles.typeBadge} ${order.type === 'makanan' ? styles.food : styles.laundry}`}>
            {order.type === 'makanan' ? '🍔 Makanan' : '🫧 Laundry'}
          </span>
          <h3>{order.type === 'makanan' ? order.warungName : order.laundryName}</h3>
          <p className={styles.meta}>
            👤 {order.userName} · {order.userEmail}
          </p>
          <p className={styles.meta}>
            🕐 {new Date(order.createdAt).toLocaleString('id-ID')}
          </p>
        </div>
        <div className={styles.cardRight}>
          <StatusBadge status={order.status} />
          <strong className={styles.totalPrice}>Rp {formatRupiah(order.total)}</strong>
        </div>
      </div>

      {/* Detail pesanan */}
      <div className={styles.detail}>
        {order.type === 'makanan' && order.items?.map((item, i) => (
          <span key={i} className={styles.itemTag}>{item.name} x{item.qty}</span>
        ))}
        {order.type === 'laundry' && (
          <>
            <span className={styles.itemTag}>{order.service}</span>
            <span className={styles.itemTag}>{order.durasi} · {order.berat} kg</span>
            {order.estimasiSelesai && <span className={styles.itemTag}>📅 {order.estimasiSelesai}</span>}
          </>
        )}
      </div>

      {/* Alamat */}
      <p className={styles.alamat}>📍 {order.alamat}</p>
      {order.catatan && <p className={styles.catatan}>📝 {order.catatan}</p>}

      {/* Pesan sebelumnya */}
      {order.messages?.length > 0 && (
        <div className={styles.prevMessages}>
          {order.messages.map((m, i) => (
            <div key={i} className={styles.prevMsg}>
              <span>📢 {m.text}</span>
              <small>{new Date(m.time).toLocaleString('id-ID')}</small>
            </div>
          ))}
        </div>
      )}

      {/* Aksi admin */}
      {order.status !== 'Selesai' && order.status !== 'Dibatalkan' && (
        <div className={styles.actions}>
          {!showMsgBox ? (
            <button className={styles.actionBtn} onClick={() => setShowMsgBox(true)}>
              📤 Update Status & Kirim Pesan
            </button>
          ) : (
            <div className={styles.msgBox}>
              <select className={styles.statusSelect} value={selStatus}
                onChange={e => setSelStatus(e.target.value)}>
                {ORDER_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <textarea
                className={styles.msgInput}
                placeholder="Tulis pesan ke user (opsional)..."
                value={msg}
                onChange={e => setMsg(e.target.value.slice(0, 200))}
                rows={2}
                maxLength={200}
              />
              <div className={styles.msgBtns}>
                <button className={styles.cancelBtn} onClick={() => { setShowMsgBox(false); setMsg('') }}>
                  Batal
                </button>
                <button className={styles.sendBtn} onClick={handleSend}>
                  ✅ Kirim Update
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { user, orders, logout, updateOrderStatus } = useAuth()
  const navigate  = useNavigate()
  const [filter,  setFilter]  = useState('semua')   // semua | makanan | laundry
  const [statusF, setStatusF] = useState('semua')

  if (!user || user.role !== 'admin') { navigate('/login', { replace: true }); return null }

  const filtered = orders.filter(o => {
    const typeOk   = filter   === 'semua' || o.type   === filter
    const statusOk = statusF  === 'semua' || o.status === statusF
    return typeOk && statusOk
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const counts = {
    total:   orders.length,
    pending: orders.filter(o => o.status === 'Menunggu Konfirmasi').length,
    proses:  orders.filter(o => ['Dikonfirmasi','Sedang Diproses','Sedang Diantar'].includes(o.status)).length,
    selesai: orders.filter(o => o.status === 'Selesai').length,
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar admin */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <img src="/assets/image/Logo.png" alt="Nearify" height="60" />
          <span>Admin Panel</span>
        </div>

        <nav className={styles.nav}>
          <button className={`${styles.navItem} ${styles.active}`}>📋 Pesanan Masuk</button>
        </nav>

        <div className={styles.adminInfo}>
          <div className={styles.adminAvatar}>A</div>
          <div>
            <p>{user.name}</p>
            <small>Administrator</small>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/') }}>
          🚪 Logout
        </button>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>Pesanan Masuk</h1>
            <p>Kelola dan update status pesanan user</p>
          </div>
        </header>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span>Total Pesanan</span><h3>{counts.total}</h3>
          </div>
          <div className={`${styles.statCard} ${styles.statPending}`}>
            <span>Menunggu</span><h3>{counts.pending}</h3>
          </div>
          <div className={`${styles.statCard} ${styles.statProses}`}>
            <span>Diproses</span><h3>{counts.proses}</h3>
          </div>
          <div className={`${styles.statCard} ${styles.statSelesai}`}>
            <span>Selesai</span><h3>{counts.selesai}</h3>
          </div>
        </div>

        {/* Filter */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Tipe:</label>
            {['semua','makanan','laundry'].map(f => (
              <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                onClick={() => setFilter(f)}>
                {f === 'semua' ? 'Semua' : f === 'makanan' ? '🍔 Makanan' : '🫧 Laundry'}
              </button>
            ))}
          </div>
          <div className={styles.filterGroup}>
            <label>Status:</label>
            <select className={styles.statusFilter} value={statusF} onChange={e => setStatusF(e.target.value)}>
              <option value="semua">Semua Status</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* List pesanan */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <span>📭</span>
            <p>Tidak ada pesanan</p>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
