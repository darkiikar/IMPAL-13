import { useState } from 'react'
import Sidebar from '../../components/Sidebar.jsx'
import Topbar  from '../../components/Topbar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatRupiah } from '../../data/mockData.js'
import styles from './TopUpPage.module.css'

const NOMINALS = [10000, 20000, 50000, 100000, 200000, 500000]

const PAYMENT_METHODS = [
  { id: 'qris',    label: 'QRIS',          icon: '📱', desc: 'Semua dompet digital' },
  { id: 'gopay',   label: 'GoPay',         icon: '💚', desc: 'Bayar via GoPay' },
  { id: 'ovo',     label: 'OVO',           icon: '💜', desc: 'Bayar via OVO' },
  { id: 'dana',    label: 'DANA',          icon: '💙', desc: 'Bayar via DANA' },
  { id: 'bca',     label: 'Transfer BCA',  icon: '🏦', desc: 'Virtual account BCA' },
  { id: 'mandiri', label: 'Mandiri',       icon: '🏦', desc: 'Virtual account Mandiri' },
]

export default function TopUpPage() {
  const { user, updateSaldo } = useAuth()
  const [nominal, setNominal] = useState(null)
  const [custom,  setCustom]  = useState('')
  const [method,  setMethod]  = useState(null)
  const [step,    setStep]    = useState('form') // form | confirm | processing | success
  const [error,   setError]   = useState('')

  const amount = nominal ?? (parseInt(custom.replace(/\D/g, ''), 10) || 0)

  const handleCustomChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 10) return // max 10 digit
    setCustom(raw)
    setNominal(null)
    setError('')
  }

  const handleNext = () => {
    if (amount < 10000)  { setError('Minimal top up Rp 10.000'); return }
    if (amount > 10000000) { setError('Maksimal top up Rp 10.000.000'); return }
    if (!method)         { setError('Pilih metode pembayaran'); return }
    setError('')
    setStep('confirm')
  }

  const handlePay = async () => {
    setStep('processing')
    // ── Ganti dengan Midtrans Snap di production ──
    await new Promise(r => setTimeout(r, 1500))
    updateSaldo(amount)
    setStep('success')
  }

  const handleReset = () => {
    setNominal(null); setCustom(''); setMethod(null)
    setStep('form'); setError('')
  }

  if (!user) return null

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Topbar />

        <div className={styles.pageHeader}>
          <h1>💳 Top Up Saldo</h1>
          <p>Tambah saldo Nearify untuk bayar pesanan</p>
        </div>

        <div className={styles.content}>
          <div className={styles.saldoCard}>
            <span>Saldo saat ini</span>
            <h2>Rp {formatRupiah(user.saldo)}</h2>
          </div>

          {step === 'form' && (
            <>
              <section className={styles.section}>
                <h3>Pilih Nominal</h3>
                <div className={styles.nominalGrid}>
                  {NOMINALS.map(n => (
                    <button key={n}
                      className={`${styles.nominalBtn} ${nominal === n ? styles.selected : ''}`}
                      onClick={() => { setNominal(n); setCustom(''); setError('') }} type="button">
                      Rp {formatRupiah(n)}
                    </button>
                  ))}
                </div>
                <div className={styles.customWrap}>
                  <span>Rp</span>
                  <input type="text" inputMode="numeric" placeholder="Nominal lain..."
                    value={custom ? parseInt(custom).toLocaleString('id-ID') : ''}
                    onChange={handleCustomChange} className={styles.customInput} />
                </div>
              </section>

              <section className={styles.section}>
                <h3>Metode Pembayaran</h3>
                <div className={styles.methodGrid}>
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.id}
                      className={`${styles.methodBtn} ${method?.id === m.id ? styles.selected : ''}`}
                      onClick={() => { setMethod(m); setError('') }} type="button">
                      <span className={styles.methodIcon}>{m.icon}</span>
                      <div><b>{m.label}</b><small>{m.desc}</small></div>
                    </button>
                  ))}
                </div>
              </section>

              {error && <p className={styles.error} role="alert">{error}</p>}

              <button className={styles.primaryBtn} onClick={handleNext}
                disabled={amount < 10000 || !method}>
                Lanjut — {amount >= 10000 ? `Rp ${formatRupiah(amount)}` : 'Pilih nominal'}
              </button>
            </>
          )}

          {step === 'confirm' && (
            <section className={styles.section}>
              <h3>Konfirmasi Top Up</h3>
              <div className={styles.confirmDetail}>
                <div className={styles.confirmRow}><span>Nominal</span><strong>Rp {formatRupiah(amount)}</strong></div>
                <div className={styles.confirmRow}><span>Metode</span><strong>{method?.icon} {method?.label}</strong></div>
                <div className={styles.confirmRow}><span>Saldo setelah</span><strong>Rp {formatRupiah(user.saldo + amount)}</strong></div>
              </div>
              <p className={styles.note}>
                {method?.id === 'qris'    && 'Scan QR code yang akan ditampilkan untuk menyelesaikan pembayaran.'}
                {['gopay','ovo','dana'].includes(method?.id) && `Notifikasi pembayaran akan dikirim ke aplikasi ${method?.label} kamu.`}
                {['bca','mandiri'].includes(method?.id)      && `Kode virtual account akan ditampilkan. Transfer sebelum batas waktu.`}
              </p>
              <div className={styles.confirmBtns}>
                <button className={styles.secondaryBtn} onClick={() => setStep('form')}>← Kembali</button>
                <button className={styles.primaryBtn}   onClick={handlePay}>Bayar Sekarang</button>
              </div>
            </section>
          )}

          {step === 'processing' && (
            <div className={styles.processingWrap}>
              <div className={styles.spinner} />
              <p>Memproses pembayaran...</p>
              <small>Jangan tutup halaman ini</small>
            </div>
          )}

          {step === 'success' && (
            <div className={styles.successWrap}>
              <div className={styles.successIcon}>✅</div>
              <h2>Top Up Berhasil!</h2>
              <p>Saldo kamu sekarang</p>
              <h3 className={styles.newSaldo}>Rp {formatRupiah(user.saldo)}</h3>
              <button className={styles.primaryBtn} onClick={handleReset}>Top Up Lagi</button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
