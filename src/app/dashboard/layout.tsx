import Sidebar from './Sidebar';
import styles from './dashboard-layout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
