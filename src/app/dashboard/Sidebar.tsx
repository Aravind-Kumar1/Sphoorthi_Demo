'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserButton, useUser, SignOutButton } from '@clerk/nextjs';
import styles from './dashboard-layout.module.css';

const navItems = [
  { 
    href: '/dashboard', 
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>, 
    label: 'Dashboard' 
  },
  { 
    href: '/dashboard/add-person', 
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="17" y1="11" x2="23" y2="11"></line></svg>, 
    label: 'Add Member' 
  },
];

export default function Sidebar() {
  const path = usePathname();
  const { user } = useUser();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarBrand} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        paddingLeft: '0.25rem' 
      }}>
        <span className={styles.brandName} style={{ fontSize: '1rem' }}>MEMBERSHIP CARD</span>
      </div>
      <nav className={styles.nav}>
        {navItems.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${path === href ? styles.navItemActive : ''}`}
          >
            <span className={styles.navIcon}>{icon}</span>
            <span className={styles.navLabel}>{label}</span>
          </Link>
        ))}
      </nav>
      <div className={styles.sidebarFooter}>
        <UserButton 
          appearance={{ 
            elements: { 
              userButtonAvatarBox: { width: '36px', height: '36px' }
            } 
          }} 
        />
        <div className={styles.footerInfo} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className={styles.footerLabel} style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            {user?.fullName || 'Account'}
          </span>
        </div>
      </div>
    </aside>
  );
}
