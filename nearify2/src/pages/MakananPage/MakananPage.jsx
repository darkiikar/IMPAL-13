import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar.jsx'
import Topbar  from '../../components/Topbar.jsx'
import { WARUNG_LIST, formatRupiah } from '../../data/mockData.js'
import { useAuth } from '../../context/AuthContext.jsx'
import styles from './MakananPage.module.css'

// ── Komponen kartu warung ──
function WarungCard({ warung, onSelect }) {
  return (
    <article className={`${styles.warungCard} ${!warung.isOpen ? styles.warungClosed : ''}`}
      onClick={() => warung.isOpen && onSelect(warung)} tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && warung.isOpen && onSelect(warung)}>
      <div className={styles.warungThumb} style={{ background: warung.bg }}>{warung.emoji}</div>
      <div className={styles.warungInfo}>
        <h3>{warung.name}</h3>
        <p className={styles.category}>{warung.category}</p>
        <p className={styles.address}>📍 {warung.address}</p>
        <div className={styles.warungMeta}>
          <span>{warung.distance}</span>
          <span className={warung.isOpen ? styles.open : styles.closed}>
            {warung.isOpen ? '● Buka' : '● Tutup'}
          </span>
        </div>
      </div>
      {warung.isOpen && <span className={styles.chevron}>›</span>}
    </article>
  )
}

// ── Komponen modal order ──
function OrderModal({ warung, onClose, onCheckout }) {
  const [cart, setCart] = useState({})

  const addItem  = (id) => setCart(p => ({ ...p, [id]: (p[id] || 0) + 1 }))
  const removeItem = (id) => setCart(p => {
    if (!p[id] || p[id] <= 1) { const n = { ...p }; delete n[id]; return n }
    return { ...p, [id]: p[id] - 1 }
  })

  const total = warung.menu.reduce((sum, item) =>
    sum + (cart[item.id] || 0) * item.price, 0)
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0)

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h2>{warung.name}</h2>
            <p>{warung.address}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.menuList}>
          {warung.menu.map(item => (
            <div key={item.id} className={styles.menuItem}>
              <span className={styles.menuEmoji}>{item.emoji}</span>
              <div className={styles.menuInfo}>
                <b>{item.name}</b>
                <span>Rp {formatRupiah(item.price)}</span>
              </div>
              <div className={styles.qtyControl}>
                {cart[item.id] ? (
                  <>
                    <button onClick={() => removeItem(item.id)}>−</button>
                    <span>{cart[item.id]}</span>
                    <button onClick={() => addItem(item.id)}>+</button>
                  </>
                ) : (
                  <button className={styles.addBtn} onClick={() => addItem(item.id)}>+ Tambah</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {itemCount > 0 && (
          <div className={styles.modalFooter}>
            <div className={styles.totalInfo}>
              <span>{itemCount} item</span>
              <strong>Rp {formatRupiah(total)}</strong>
            </div>
            <button className={styles.checkoutBtn}
              onClick={() => onCheckout(warung, cart, total)}>
              Checkout →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Komponen checkout ──
function CheckoutModal({ warung, cart, total, onClose, onSuccess }) {
  const { user, updateSaldo, addOrder } = useAuth()
  const [alamat, setAlamat] = useState('')
  const [catatan, setCatatan] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const items = warung.menu.filter(m => cart[m.id])

  const handleBayar = async () => {
    if (!alamat.trim()) { setError('Alamat pengiriman wajib diisi.'); return }
    if (user.saldo < total) { setError('Saldo tidak cukup. Silakan top up terlebih dahulu.'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    updateSaldo(-total)
    addOrder({
      type: 'makanan',
      warungName: warung.name,
      items: items.map(m => ({ name: m.name, qty: cart[m.id], price: m.price })),
      total,
      alamat,
      catatan,
    })
    setLoading(false)
    onSuccess()
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Checkout</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.checkoutBody}>
          <div className={styles.orderSummary}>
            <h4>Ringkasan Pesanan — {warung.name}</h4>
            {items.map(m => (
              <div key={m.id} className={styles.summaryRow}>
                <span>{m.name} x{cart[m.id]}</span>
                <span>Rp {formatRupiah(m.price * cart[m.id])}</span>
              </div>
            ))}
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <strong>Total</strong>
              <strong>Rp {formatRupiah(total)}</strong>
            </div>
          </div>

          <label className={styles.fieldLabel}>Alamat Pengiriman *</label>
          <textarea
            className={styles.textarea}
            placeholder="Masukkan alamat lengkap..."
            value={alamat}
            onChange={e => { setAlamat(e.target.value); setError('') }}
            rows={3}
          />

          <label className={styles.fieldLabel}>Catatan (opsional)</label>
          <textarea
            className={styles.textarea}
            placeholder="Contoh: pedas sedikit, tanpa bawang..."
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            rows={2}
          />

          <div className={styles.saldoInfo}>
            <span>Saldo kamu: <strong>Rp {formatRupiah(user?.saldo ?? 0)}</strong></span>
            <span>Setelah bayar: <strong>Rp {formatRupiah((user?.saldo ?? 0) - total)}</strong></span>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button className={styles.checkoutBtn} onClick={handleBayar} disabled={loading}>
            {loading ? 'Memproses...' : `Bayar Rp ${formatRupiah(total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Komponen sukses ──
function SuccessModal({ onClose }) {
  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${styles.successModal}`}>
        <div className={styles.successIcon}>✅</div>
        <h2>Pesanan Berhasil!</h2>
        <p>Pesanan kamu sedang diproses oleh warung. Estimasi 15–30 menit.</p>
        <button className={styles.checkoutBtn} onClick={onClose}>Kembali</button>
      </div>
    </div>
  )
}

// ── Halaman utama ──
export default function MakananPage() {
  const [search, setSearch]         = useState('')
  const [selectedWarung, setSelected] = useState(null)
  const [checkoutData, setCheckoutData] = useState(null)
  const [showSuccess, setShowSuccess]   = useState(false)

  const filtered = WARUNG_LIST.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleCheckout = (warung, cart, total) => {
    setCheckoutData({ warung, cart, total })
    setSelected(null)
  }

  const handleSuccess = () => {
    setCheckoutData(null)
    setShowSuccess(true)
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Topbar searchQuery={search} onSearchChange={setSearch} />

        <div className={styles.pageHeader}>
          <h1>🍔 Makanan</h1>
          <p>Warung dan rumah makan di sekitar Purwokerto</p>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <span>🍽️</span>
            <p>Warung tidak ditemukan</p>
          </div>
        ) : (
          <div className={styles.warungGrid}>
            {filtered.map(w => (
              <WarungCard key={w.id} warung={w} onSelect={setSelected} />
            ))}
          </div>
        )}
      </main>

      {selectedWarung && !checkoutData && (
        <OrderModal
          warung={selectedWarung}
          onClose={() => setSelected(null)}
          onCheckout={handleCheckout}
        />
      )}

      {checkoutData && (
        <CheckoutModal
          warung={checkoutData.warung}
          cart={checkoutData.cart}
          total={checkoutData.total}
          onClose={() => setCheckoutData(null)}
          onSuccess={handleSuccess}
        />
      )}

      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
    </div>
  )
}
