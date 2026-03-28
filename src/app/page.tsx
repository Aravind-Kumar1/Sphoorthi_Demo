import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import styles from './page.module.css'

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }
  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroTag}>Welcome to</p>
          <h1 className={styles.heroTitle}>Sphoorthi Kutumbam</h1>
          <p className={styles.heroSubtitle}>
            A family united by inspiration, growth, and purpose.
          </p>
          <div className={styles.heroCtas}>
            <a href="#about" className={styles.btnPrimary}>Explore</a>
            <a href="#join" className={styles.btnOutline}>Join Us</a>
          </div>
        </div>
        <div className={styles.heroOrb} aria-hidden="true" />
        <div className={styles.heroOrb2} aria-hidden="true" />
      </section>

      {/* Features / Cards */}
      <section className={styles.features} id="about">
        <h2 className={styles.sectionTitle}>What We Offer</h2>
        <p className={styles.sectionSub}>A space for every mind to grow.</p>
        <div className={styles.cards}>
          {[
            { icon: '🌱', title: 'Growth', desc: 'Nurturing every individual with tools and resources for personal development.' },
            { icon: '🤝', title: 'Community', desc: 'A tight-knit family that supports, inspires, and celebrates together.' },
            { icon: '🌟', title: 'Inspiration', desc: 'Sparking motivation through shared stories, goals, and achievements.' },
          ].map((c) => (
            <div key={c.title} className={styles.card}>
              <div className={styles.cardIcon}>{c.icon}</div>
              <h3 className={styles.cardTitle}>{c.title}</h3>
              <p className={styles.cardDesc}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta} id="join">
        <div className={styles.ctaBox}>
          <h2 className={styles.ctaTitle}>Ready to be part of something bigger?</h2>
          <p className={styles.ctaSub}>Sign up and become a member of Sphoorthi Kutumbam today.</p>
          <a href="/sign-up" className={styles.btnPrimary}>Get Started →</a>
        </div>
      </section>
    </main>
  )
}
