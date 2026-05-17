import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar  from '../components/Sidebar.jsx'
import Topbar   from '../components/Topbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { WARUNG_LIST, LAUNDRY_LIST, formatRupiah } from '../data/mockData.js'
import styles from './HomePage.module.css'

function ItemCard({ item, onClick }) {
  return (
    <article className={styles.card} onClick={onClick} tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className={styles.thumb} style={{ background: item.bg }}>{item.emoji}</div>
      <div className={styles.cardBody}>
        <b>{item.name}</b>
        <small>{item.address || item.location}</small>
        <div className={styles.cardMeta}>
          <span>📍 {item.distance}</span>
          <span className={item.isOpen ? styles.open : styles.closed}>
            {item.isOpen ? 'Buka' : 'Tutup'}
          </span>
        </div>
      </div>
    </article>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFoods = WARUNG_LIST.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredLaundries = LAUNDRY_LIST.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const noResult = searchQuery && filteredFoods.length === 0 && filteredLaundries.length === 0

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Topbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* Hero */}
        <section className={styles.hero}>
          <div>
            <h2>Mau Cari Makan?<br />Atau Laundry?</h2>
            <button onClick={() => document.getElementById('searchInput')?.focus()}>
              Cari Sekarang
            </button>
          </div>
          <span>📱</span>
        </section>

        {/* Kategori cepat */}
        <section className={styles.cats}>
          <article className={styles.cat} onClick={() => navigate('/makanan')} tabIndex={0}>
            <div className={`${styles.catIcon} ${styles.food}`}>🍔</div>
            <div><h3>Makanan</h3><p>Cari warung favoritemu</p></div>
            <span className={styles.arrow}>›</span>
          </article>
          <article className={styles.cat} onClick={() => navigate('/laundry')} tabIndex={0}>
            <div className={`${styles.catIcon} ${styles.laundry}`}>🫧</div>
            <div><h3>Laundry</h3><p>Temukan laundry terdekat</p></div>
            <span className={styles.arrow}>›</span>
          </article>
        </section>

        {/* Saldo info */}
        <section className={styles.saldoCard}>
          <div>
            <p>Saldo Nearify kamu</p>
            <h3>Rp {formatRupiah(user?.saldo ?? 0)}</h3>
          </div>
          <button onClick={() => navigate('/topup')}>+ Top Up</button>
        </section>

        {/* Grid hasil search atau default */}
        {noResult ? (
          <div className={styles.empty}>
            <span>🔍</span>
            <p>Tidak ada hasil untuk "<strong>{searchQuery}</strong>"</p>
          </div>
        ) : (
          <div className={styles.grid}>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Warung Terdekat</h3>
                <button onClick={() => navigate('/makanan')}>Lihat semua ›</button>
              </div>
              <div className={styles.cards}>
                {filteredFoods.slice(0, 4).map(w => (
                  <ItemCard key={w.id} item={w} onClick={() => navigate('/makanan')} />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Laundry Terdekat</h3>
                <button onClick={() => navigate('/laundry')}>Lihat semua ›</button>
              </div>
              <div className={styles.cards}>
                {filteredLaundries.slice(0, 4).map(l => (
                  <ItemCard key={l.id} item={l} onClick={() => navigate('/laundry')} />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
