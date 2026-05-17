import styles from './AuthLayout.module.css'

export default function AuthLayout({ title, greeting, socialLabel, children }) {
  return (
    <main className={styles.container}>
      <section className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.greeting}>{greeting}</p>
      </section>
      <section className={styles.right}>
        {children}
      </section>
    </main>
  )
}
