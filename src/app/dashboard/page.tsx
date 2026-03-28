'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import styles from './dashboard.module.css';

export type Person = {
  id: string;
  name: string;
  fatherName: string;
  email: string;
  phone: string;
  aadharNo: string;
  dob: string;
  education: string;
  occupation: string;
  address: string;
  houseNo: string;
  village: string;
  mandal: string;
  district: string;
  pin: string;
  role: string;
  location: string;
  membershipCategory: string;
  membershipDuration: string;
  membershipAmount: string;
  joinedDate: string;
  status: 'Active' | 'Inactive' | 'Pending';
  photo: string | null;
  receiptUrl: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  Active: styles.statusActive,
  Inactive: styles.statusInactive,
  Pending: styles.statusPending,
};

// Helper to sanitize database output to match our Person type
const sanitizeMember = (m: any): Person => ({
  id: m.id,
  name: m.full_name,
  fatherName: m.father_name || '—',
  email: m.email,
  phone: m.phone || '—',
  aadharNo: m.aadhar_no || '—',
  dob: m.dob || '—',
  education: m.education || '—',
  occupation: m.occupation || '—',
  address: m.address || '—',
  houseNo: m.house_no || '—',
  village: m.village || '—',
  mandal: m.mandal || '—',
  district: m.district || '—',
  pin: m.pin || '—',
  role: m.role || 'Member',
  location: m.location || '—',
  membershipCategory: m.membership_category || '—',
  membershipDuration: m.membership_duration || '—',
  membershipAmount: m.membership_amount || '0',
  joinedDate: m.created_at,
  status: m.status,
  photo: m.photo_url,
  receiptUrl: m.receipt_url
});

export default function DashboardPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [sortCol, setSortCol] = useState<keyof Person>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);

  // Modal & Menu States
  const [modalMode, setModalMode] = useState<'view' | 'edit' | null>(null);
  const [targetPerson, setTargetPerson] = useState<Person | null>(null);
  const [currentActiveMenuId, setCurrentActiveMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number, right: number } | null>(null);

  // Deletion Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [mounted, setMounted] = useState(false);

  // Fetch using Server API (Bypass RLS)
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/get-members');
      const json = await res.json();
      
      if (json.error) throw new Error(json.error);
      if (json.data) setPeople(json.data.map(sanitizeMember));
      
    } catch (err: any) {
      console.error('Members fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchMembers();
  }, []);

  const filtered = people
    .filter(p => {
      const q = search.toLowerCase();
      return (p.name || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const av = a[sortCol] as string;
      const bv = b[sortCol] as string;
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  // Calculate Pagination
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

  const toggleSort = (col: keyof Person) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const toggleAll = () =>
    setSelected(selected.length === paginatedData.length ? [] : paginatedData.map(p => p.id));

  // Delete using Server API (Bypass RLS)
  const deleteSelected = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/delete-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected })
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setPeople(p => p.filter(x => !selected.includes(x.id)));
      setSelected([]);
      toast.success('Members removed permanently');
      setShowDeleteModal(false);
      
    } catch (err: any) {
      toast.error('Error deleting: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const setPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const SortIcon = ({ col }: { col: keyof Person }) => (
    <span className={styles.sortIcon}>
      {sortCol === col ? (
        sortDir === 'asc' ? 
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 15l-6-6-6 6"></path></svg> : 
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"></path></svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.4"><path d="M7 15l5 5 5-5M7 9l5-5 5 5"></path></svg>
      )}
    </span>
  );
  // Clean space at 153 to avoid duplicate cache collisions
  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (!mounted) return null;

  return (
    <div className={styles.page}>
      {/* Row 1: Page Title & Global Action */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>{people.length} people registered in SPHOORTHI KUTUMBAM TELANGANA - WARANGAL DIVISION</p>
        </div>
        <Link href="/dashboard/add-person" className={styles.btnAdd}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Person
        </Link>
      </div>

      {/* Row 2: Search [Left] + Stats [Right] */}
      <div className={styles.topBar}>
        <div className={styles.searchWrap} style={{ maxWidth: '320px' }}>
          <span className={styles.searchIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by name only..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className={styles.stats}>
          {loading ? (
            <div className={styles.skeletonPulse} style={{ height: '2.5rem', width: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
          ) : (
            <>
              {(['Active', 'Inactive', 'Pending'] as const).map(s => (
                <div key={s} className={styles.statCard}>
                  <span className={styles.statCount}>{people.filter(p => p.status === s).length}</span>
                  <span className={styles.statLabel}>{s}</span>
                </div>
              ))}
              <div className={styles.statCard} style={{ borderRight: 'none' }}>
                <span className={styles.statTotal}>{people.length}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {/* Toolbar - Only Delete now */}
        {selected.length > 0 && (
          <div className={styles.toolbar}>
            <button className={styles.btnDelete} onClick={() => setShowDeleteModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Delete {selected.length} Selected
            </button>
          </div>
        )}

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thCheck}>
                  <input
                    type="checkbox"
                    checked={selected.length === paginatedData.length && paginatedData.length > 0}
                    onChange={toggleAll}
                    className={styles.checkbox}
                  />
                </th>
                <th className={styles.th} style={{ width: '60px' }}>Sl No</th>
                <th className={styles.th} onClick={() => toggleSort('name')}>Name <SortIcon col="name" /></th>
                <th className={styles.th} onClick={() => toggleSort('email')}>Email <SortIcon col="email" /></th>
                <th className={styles.th} onClick={() => toggleSort('role')}>Role <SortIcon col="role" /></th>
                <th className={styles.th} onClick={() => toggleSort('location')}>Location <SortIcon col="location" /></th>
                <th className={styles.th} onClick={() => toggleSort('status')}>Status <SortIcon col="status" /></th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className={styles.tr}>
                    <td colSpan={7}>
                      <div className={styles.rowSkeleton} />
                    </td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className={styles.emptyRow}>
                    No members found. <Link href="/dashboard/add-person" className={styles.emptyLink}>Add one →</Link>
                  </td>
                </tr>
              ) : paginatedData.map((p, i) => (
                <tr
                  key={p.id}
                  className={`${styles.tr} ${selected.includes(p.id) ? styles.trSelected : ''} ${i % 2 === 0 ? styles.trEven : ''}`}
                >
                  <td className={styles.tdCheck}>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className={styles.checkbox}
                    />
                  </td>
                  <td className={styles.td} style={{ color: '#667', fontWeight: 600 }}>{startIndex + i + 1}</td>
                  <td className={styles.td}>
                    <div className={styles.nameCell}>
                      <span className={styles.nameText}>{p.name}</span>
                    </div>
                  </td>
                  <td className={styles.td}><span className={styles.emailText}>{p.email}</span></td>
                  <td className={styles.td}><span className={styles.roleBadge}>{p.role}</span></td>
                  <td className={styles.td}>{p.location}</td>
                  <td className={styles.td}>
                    <span className={`${styles.statusBadge} ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                  </td>
                  <td className={styles.td}>
                    <div className={`${styles.menuContainer} ${currentActiveMenuId === p.id ? styles.menuContainerActive : ''}`}>
                      <button 
                        className={styles.btnDots}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuAnchor({ 
                            top: rect.bottom + 5, 
                            right: window.innerWidth - rect.right 
                          });
                          setCurrentActiveMenuId(currentActiveMenuId === p.id ? null : p.id);
                        }}
                      >
                        ⋮
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div className={styles.tableFooter}>
          <div className={styles.resultsCount}>
            <span>Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} members</span>
            <div className={styles.perPageWrap}>
              <span>Rows per page:</span>
              <select 
                value={itemsPerPage} 
                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className={styles.perPageSelect}
              >
                {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          
          <div className={styles.pagination}>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </button>
            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  className={`${styles.pageNum} ${currentPage === pageNum ? styles.pageNumActive : ''}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Action Menu Portal */}
      {currentActiveMenuId && menuAnchor && (
        <ActionMenuPortal 
          anchor={menuAnchor}
          onClose={() => setCurrentActiveMenuId(null)}
          onView={() => { setModalMode('view'); setTargetPerson(people.find(p => p.id === currentActiveMenuId) || null); setCurrentActiveMenuId(null); }}
          onEdit={() => { setModalMode('edit'); setTargetPerson(people.find(p => p.id === currentActiveMenuId) || null); setCurrentActiveMenuId(null); }}
          onDelete={() => { setSelected([currentActiveMenuId]); setShowDeleteModal(true); setCurrentActiveMenuId(null); }}
        />
      )}

      {/* Member Modal */}
      {modalMode && targetPerson && (
        <MemberModal 
          mode={modalMode} 
          person={targetPerson} 
          onClose={() => setModalMode(null)}
          onSave={async (updates: Partial<Person>) => {
            const res = await fetch('/api/update-member', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: targetPerson.id, ...updates })
            });
            if (res.ok) {
              toast.success('Member updated successfully!');
              fetchMembers();
              setModalMode(null);
            } else {
              toast.error('Failed to update member.');
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal 
          count={selected.length}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={deleteSelected}
          isDeleting={deleting}
        />
      )}
    </div>
  );
}

/* ===================== HELPER COMPONENTS ===================== */

function ActionMenuPortal({ anchor, onClose, onView, onEdit, onDelete }: any) {
  useEffect(() => {
    const handleClose = () => onClose();
    // Use mousedown to close on any outside click
    window.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', handleClose, true);
    
    return () => {
      window.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, [onClose]);

  return createPortal(
    <div 
      className={styles.dropdownMenuPortal} 
      style={{ top: anchor.top, right: anchor.right }}
      onClick={e => e.stopPropagation()}
      // OnMouseDown stopPropagation prevents the menu itself from triggering handleClose
      onMouseDown={e => e.stopPropagation()}
    >
      <button className={styles.menuItem} onClick={onView}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        View Details
      </button>
      <button className={styles.menuItem} onClick={onEdit}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Edit Member
      </button>
      <button className={`${styles.menuItem} ${styles.menuItemDelete}`} onClick={onDelete}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        Delete Record
      </button>
    </div>,
    document.body
  );
}

function MemberModal({ mode, person, onClose, onSave }: any) {
  const [form, setForm] = useState(person);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const DetailItem = ({ label, value }: { label: string, value: any }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label style={{ fontSize: '0.65rem', color: '#667', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ fontSize: '0.875rem', color: '#eee', fontWeight: 500 }}>{value}</div>
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <div style={{ gridColumn: '1 / -1', fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '1rem', paddingBottom: '0.25rem', borderBottom: '1px solid rgba(99, 102, 241, 0.15)' }}>
      {title}
    </div>
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: mode === 'view' ? '700px' : '550px' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{mode === 'view' ? 'Membership Details' : 'Edit Member'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#667', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>
        
        <div className={styles.modalBody}>
          {mode === 'view' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <SectionTitle title="Personal Information" />
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                {person.photo ? (
                  <Image src={person.photo} alt={person.name} width={80} height={80} style={{ borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '12px', background: 'var(--clr-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>{person.name[0]}</div>
                )}
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{person.name}</div>
                  <div style={{ color: 'var(--clr-accent)', fontSize: '0.85rem', fontWeight: 600 }}>{person.role} • {person.membershipCategory}</div>
                </div>
              </div>

              <DetailItem label="Father Name" value={person.fatherName} />
              <DetailItem label="Aadhar Number" value={person.aadharNo} />
              <DetailItem label="Date of Birth" value={person.dob} />
              <DetailItem label="Education" value={person.education} />
              <DetailItem label="Occupation" value={person.occupation} />
              <DetailItem label="Status" value={person.status} />

              <SectionTitle title="Contact & Address" />
              <DetailItem label="Email" value={person.email} />
              <DetailItem label="Phone" value={person.phone} />
              <div style={{ gridColumn: '1 / -1' }}>
                <DetailItem label="Full Address" value={`${person.houseNo}, ${person.address}, ${person.village}, ${person.mandal}, ${person.district} - ${person.pin}`} />
              </div>

              <SectionTitle title="Membership & Payment" />
              <DetailItem label="Category" value={person.membershipCategory} />
              <DetailItem label="Duration" value={person.membershipDuration} />
              <DetailItem label="Fee Paid" value={`₹ ${person.membershipAmount}`} />
              <DetailItem label="Joined Date" value={new Date(person.joinedDate).toLocaleDateString()} />

              {person.receiptUrl && (
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--clr-accent)', fontWeight: 800, textTransform: 'uppercase' }}>Payment Receipt</label>
                  <div style={{ marginTop: '0.5rem' }}>
                    <Image 
                      src={person.receiptUrl} 
                      alt="Receipt" 
                      width={200} 
                      height={200} 
                      style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'zoom-in' }}
                      onClick={() => window.open(person.receiptUrl, '_blank')}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#667', fontWeight: 600 }}>FULL NAME</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={styles.modalInput} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#667', fontWeight: 600 }}>EMAIL ADDRESS</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={styles.modalInput} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#667', fontWeight: 600 }}>ROLE</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className={styles.modalSelect}>
                  {['Coordinator', 'Volunteer', 'Member', 'Admin', 'Observer'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#667', fontWeight: 600 }}>STATUS</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={styles.modalSelect}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.pageBtn} disabled={saving}>Close</button>
          {mode === 'edit' && (
            <button 
              onClick={handleSave} 
              disabled={saving}
              className={styles.pageBtn}
              style={{ background: 'var(--clr-accent)', borderColor: 'var(--clr-accent)', color: '#fff' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ count, onClose, onConfirm, isDeleting }: any) {
  return (
    <div className={styles.modalOverlay} onClick={onClose} style={{ zIndex: 3000 }}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Confirm Removal</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#667', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>
        <div className={styles.modalBody}>
          <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Are you sure you want to remove <strong style={{ color: '#fff' }}>{count} member(s)</strong> permanently from SPHOORTHI KUTUMBAM?
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.pageBtn} disabled={isDeleting}>Cancel</button>
          <button 
            onClick={onConfirm} 
            disabled={isDeleting}
            className={styles.pageBtn}
            style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}

