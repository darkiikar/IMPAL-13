// HeroBanner.jsx
import styles from './HeroBanner.module.css'

export function HeroBanner({ onCari }) {
  return (
    <section className={styles.hero} aria-label="Banner utama">
      <div>
        <h2>Mau Cari Makan?<br />Atau Laundry?</h2>
        <button onClick={onCari}>Cari Sekarang</button>
      </div>
      <span aria-hidden="true">📱</span>
    </section>
  )
}

export default HeroBanner
