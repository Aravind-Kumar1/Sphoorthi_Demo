'use client';
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth
} from '@clerk/nextjs';

import Image from 'next/image';

export default function Header() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="site-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Left Side: Brand Logo */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.4)',
          border: '2px solid rgba(255,255,255,0.15)',
          background: '#000'
        }}>
          <Image
            src="/logo.jpg"
            alt="SPHOORTHI KUTUMBAM"
            width={72}
            height={72}
            style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <span className="site-header__brand" style={{ height: 'auto', padding: 0, fontSize: '1.25rem', lineHeight: 1.1 }}>
            SPHOORTHI KUTUMBAM <span style={{ color: '#fff', fontSize: '1.25rem' }}>- Telangana</span>
          </span>
          <span className="site-header__tagline" style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'var(--clr-muted)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: 0.8
          }}>
            A Spiritual, Scientific and humanitarian charitable Trust
          </span>
        </div>
      </div>

      <div className="site-header__auth">
        {!isLoaded ? (
          <div style={{ width: '80px', height: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px' }} />
        ) : !isSignedIn ? (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <SignInButton mode="modal">
              <button className="btn-auth-base btn-auth-in">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn-auth-base btn-auth-up">Sign Up</button>
            </SignUpButton>
          </div>
        ) : (
          <span style={{
            color: '#fff',
            fontWeight: '700',
            fontSize: '1.15rem',
            letterSpacing: '0.05em',
            fontFamily: 'var(--font-poppins)',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
          }}>
            Sphoorthi Oum
          </span>
        )}
      </div>
    </header>
  );
}
