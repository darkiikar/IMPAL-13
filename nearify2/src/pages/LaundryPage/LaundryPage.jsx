import { useState } from 'react'
import Sidebar from '../../components/Sidebar.jsx'
import Topbar  from '../../components/Topbar.jsx'
import { LAUNDRY_LIST, formatRupiah } from '../../data/mockData.js'
import { useAuth } from '../../context/AuthContext.jsx'
import styles from './LaundryPage.module.css'

const DURASI = [
  { id: 'reguler', label: 'Reguler', days: 3, extraPrice: 0,    desc: 'Selesai dalam 3 hari' },
  { id: 'express', label: 'Express', days: 1, extraPrice: 3000, desc: 'Selesai dalam 1 hari (+Rp 3.000/kg)' },
]

function LaundryCard({ laundry, onSelect }) {
  return (
    <article
      className={`${styles.card} ${!laundry.isOpen ? styles.cardClosed : ''}`}
      onClick={() => laundry.isOpen && onSelect(laundry)}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && laundry.isOpen && onSelect(laundry)}
    >
      <div className={styles.thumb} style={{ background: laundry.bg }}>{laundry.emoji}</div>
      <div className={styles.info}>
        <h3>{laundry.name}</h3>
        <p className={styles.address}>📍 {laundry.address}</p>
        <div className={styles.meta}>
          <span>{laundry.distance}</span>
          <span className={laundry.isOpen ? styles.open : styles.closed}>
            {laundry.isOpen ? '● Buka' : '● Tutup'}
          </span>
        </div>
        <div className={styles.priceRange}>
          Mulai Rp {formatRupiah(Math.min(...laundry.services.map(s => s.pricePerKg)))}/kg
        </div>
      </div>
      {laundry.isOpen && <span className={styles.chevron}>›</span>}
    </article>
  )
}

function OrderModal({ laundry, onClose, onCheckout }) {
  const [service,  setService]  = useState(laundry.services[0])
  const [durasi,   setDurasi]   = useState(DURASI[0])
  const [berat,    setBerat]    = useState(1)
  const [alamat,   setAlamat]   = useState('')
  const [catatan,  setCatatan]  = useState('')
  const [step,     setStep]     = useState('form')  // form | confirm
  const { user, updateSaldo, addOrder } = useAuth()
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const pricePerKg = service.pricePerKg + durasi.extraPrice
  const total      = pricePerKg * berat
  const selesai    = new Date()
  selesai.setDate(selesai.getDate() + durasi.days)
  const selesaiStr = selesai.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })

  const handleOrder = async () => {
    if (!alamat.trim()) { setError('Alamat penjemputan wajib diisi.'); return }
    if (user.saldo < total) { setError('Saldo tidak cukup. Silakan top up terlebih dahulu.'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    updateSaldo(-total)
    addOrder({
      type: 'laundry',
      laundryName: laundry.name,
      service: service.name,
      durasi: durasi.label,
      berat,
      total,
      alamat,
      catatan,
      estimasiSelesai: selesaiStr,
    })
    setLoading(false)
    onCheckout()
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h2>{laundry.name}</h2>
            <p>{laundry.address}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {/* Pilih layanan */}
          <label className={styles.sectionLabel}>Pilih Layanan</label>
          <div className={styles.optionGrid}>
            {laundry.services.map(s => (
              <button
                key={s.id}
                className={`${styles.optionBtn} ${service.id === s.id ? styles.optionActive : ''}`}
                onClick={() => setService(s)}
                type="button"
              >
                <b>{s.name}</b>
                <span>Rp {formatRupiah(s.pricePerKg)}/kg</span>
              </button>
            ))}
          </div>

          {/* Pilih durasi */}
          <label className={styles.sectionLabel}>Pilih Durasi</label>
          <div className={styles.optionGrid}>
            {DURASI.map(d => (
              <button
                key={d.id}
                className={`${styles.optionBtn} ${durasi.id === d.id ? styles.optionActive : ''}`}
                onClick={() => setDurasi(d)}
                type="button"
              >
                <b>{d.label}</b>
                <span>{d.desc}</span>
              </button>
            ))}
          </div>

          {/* Input berat */}
          <label className={styles.sectionLabel}>Perkiraan Berat (kg)</label>
          <div className={styles.beratControl}>
            <button type="button" onClick={() => setBerat(b => Math.max(1, b - 1))}>−</button>
            <span>{berat} kg</span>
            <button type="button" onClick={() => setBerat(b => b + 1)}>+</button>
          </div>

          {/* Alamat */}
          <label className={styles.sectionLabel}>Alamat Penjemputan *</label>
          <textarea
            className={styles.textarea}
            placeholder="Masukkan alamat lengkap..."
            value={alamat}
            onChange={e => { setAlamat(e.target.value); setError('') }}
            rows={3}
          />

          {/* Catatan */}
          <label className={styles.sectionLabel}>Catatan (opsional)</label>
          <textarea
            className={styles.textarea}
            placeholder="Contoh: ada baju putih, tolong pisahkan..."
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            rows={2}
          />

          {/* Ringkasan */}
          <div className={styles.summary}>
            <div className={styles.summaryRow}><span>Layanan</span><span>{service.name}</span></div>
            <div className={styles.summaryRow}><span>Durasi</span><span>{durasi.label}</span></div>
            <div className={styles.summaryRow}><span>Estimasi selesai</span><span>{selesaiStr}</span></div>
            <div className={styles.summaryRow}><span>Harga/kg</span><span>Rp {formatRupiah(pricePerKg)}</span></div>
            <div className={styles.summaryRow}><span>Berat</span><span>{berat} kg</span></div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <strong>Total</strong>
              <strong>Rp {formatRupiah(total)}</strong>
            </div>
          </div>

          <div className={styles.saldoInfo}>
            <span>Saldo kamu: <strong>Rp {formatRupiah(user?.saldo ?? 0)}</strong></span>
            <span>Setelah bayar: <strong>Rp {formatRupiah((user?.saldo ?? 0) - total)}</strong></span>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button className={styles.orderBtn} onClick={handleOrder} disabled={loading}>
            {loading ? 'Memproses...' : `Pesan — Rp ${formatRupiah(total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function SuccessModal({ onClose }) {
  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${styles.successModal}`}>
        <div className={styles.successIcon}>✅</div>
        <h2>Pesanan Laundry Berhasil!</h2>
        <p>Laundry akan menjemput pakaian kamu sesuai alamat yang diberikan.</p>
        <button className={styles.orderBtn} onClick={onClose}>Kembali</button>
      </div>
    </div>
  )
}

export default function LaundryPage() {
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const filtered = LAUNDRY_LIST.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Topbar searchQuery={search} onSearchChange={setSearch} />

        <div className={styles.pageHeader}>
          <h1>🫧 Laundry</h1>
          <p>Layanan laundry terdekat di Purwokerto</p>
        </div>

        <div className={styles.cardGrid}>
          {filtered.map(l => (
            <LaundryCard key={l.id} laundry={l} onSelect={setSelected} />
          ))}
        </div>
      </main>

      {selected && !showSuccess && (
        <OrderModal
          laundry={selected}
          onClose={() => setSelected(null)}
          onCheckout={() => { setSelected(null); setShowSuccess(true) }}
        />
      )}

      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
    </div>
  )
}
