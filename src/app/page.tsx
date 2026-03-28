import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import styles from './page.module.css'

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }
  return (
    <main className={styles.main}>
      {/* One-Section Hero Landing */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
            <Image 
              src="/logo.jpg" 
              alt="SPHOORTHI KUTUMBAM Logo" 
              width={260} 
              height={260} 
              style={{ borderRadius: '12px', objectFit: 'cover', objectPosition: 'center 20%', boxShadow: '0 20px 80px rgba(0,0,0,0.9)', border: '2px solid rgba(255,255,255,0.25)' }} 
            />
          </div>
          <h1 className={styles.heroTitle}>SPHOORTHI KUTUMBAM</h1>
          <p className={styles.heroSubtitle}>
            A family united by inspiration, growth, and purpose.
          </p>
        </div>
        <div className={styles.heroOrb} aria-hidden="true" />
        <div className={styles.heroOrb2} aria-hidden="true" />
      </section>
    </main>
  )
}
