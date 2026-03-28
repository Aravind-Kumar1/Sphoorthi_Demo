'use client';
import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { sendWelcomeEmail } from '@/lib/email-service';
import styles from './add-person.module.css';

import { useUser } from '@clerk/nextjs';

type FormData = {
  name: string;
  fatherName: string;
  email: string;
  phone: string;
  aadharNo: string;
  panNo: string;
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
  membershipCategory: 'Adult Member' | 'Young Member' | 'Life Member' | '';
  membershipDuration: '1 Year' | '2 Year' | '5 Year' | 'Life' | '';
  membershipAmount: string;
  joinedDate: string;
  status: 'Active' | 'Inactive' | 'Pending';
  bio: string;
  receipt: File | null;
  receiptPreview: string | null;
};

const INITIAL: FormData = {
  name: '', fatherName: '', email: '', phone: '', aadharNo: '', panNo: '',
  dob: '', education: '', occupation: '', address: '', houseNo: '',
  village: '', mandal: '', district: '', pin: '', role: '', location: '',
  membershipCategory: '', membershipDuration: '', membershipAmount: '0',
  joinedDate: new Date().toISOString().split('T')[0],
  status: 'Active', bio: '', 
  receipt: null, receiptPreview: null,
};


export default function AddPersonPage() {
  const router = useRouter();
  const { user } = useUser();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const receiptRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof FormData, value: string) => {
    let val = value;
    
    // Strict numeric-only for ID and Phone
    if (['phone', 'aadharNo', 'panNo', 'pin'].includes(key as string)) {
      val = value.replace(/\D/g, '').slice(0, key === 'phone' ? 10 : (key === 'aadharNo' ? 12 : 10));
    }

    setForm(f => {
      const updated = { ...f, [key]: val };
      
      // Auto-calculate membership amount based on category and duration
      if (key === 'membershipCategory' || key === 'membershipDuration') {
        const cat = updated.membershipCategory;
        const dur = updated.membershipDuration;
        
        let amt = '0';
        if (cat === 'Adult Member') {
          if (dur === '1 Year') amt = '800';
          if (dur === '2 Year') amt = '1500';
          if (dur === '5 Year') amt = '3200';
        } else if (cat === 'Young Member') {
          if (dur === '1 Year') amt = '300';
          if (dur === '2 Year') amt = '500';
          if (dur === '5 Year') amt = '1200';
        } else if (cat === 'Life Member') {
          amt = '100116';
          updated.membershipDuration = 'Life';
        }
        updated.membershipAmount = amt;
      }
      
      return updated;
    });
  };

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>, type: 'receipt') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(err => ({ ...err, [type]: 'Please upload a valid image file.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(err => ({ ...err, [type]: 'Image must be under 5 MB.' }));
      return;
    }
    const url = URL.createObjectURL(file);
    setForm(f => ({ 
      ...f, 
      [type]: file, 
      [`${type}Preview`]: url 
    } as any));
    setErrors(err => ({ ...err, [type]: undefined }));
  };

  const removePhoto = (type: 'receipt') => {
    setForm(f => ({ 
      ...f, 
      [type]: null, 
      [`${type}Preview`]: null 
    } as any));
    if (type === 'receipt' && receiptRef.current) receiptRef.current.value = '';
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim())    e.name  = 'Full name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                               e.email = 'A valid email is required.';
    
    // Strict 10-digit mobile
    if (!form.phone.trim() || form.phone.length !== 10) 
                               e.phone = 'A valid 10-digit phone number is required.';
    
    // Either Aadhar OR PAN is mandatory
    if (!form.aadharNo.trim() && !form.panNo.trim()) {
      e.aadharNo = 'Either Aadhar or PAN is mandatory.';
      e.panNo    = 'Either Aadhar or PAN is mandatory.';
    }

    if (!form.district.trim()) e.district = 'District is required.';
    if (!form.mandal.trim())   e.mandal   = 'Mandal is required.';
    if (!form.village.trim())  e.village  = 'Village/Town is required.';
    if (!form.pin.trim() || form.pin.length !== 6) 
                               e.pin     = 'Valid 6-digit Pincode is required.';
    
    if (!form.membershipCategory) e.membershipCategory = 'Category is required.';
    if (!form.receipt)            e.receipt = 'Payment receipt is mandatory.';
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate() || !user) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('clerk_user_id', user.id);
      formData.append('full_name', form.name);
      formData.append('father_name', form.fatherName);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('aadhar_no', form.aadharNo);
      formData.append('pan_no', form.panNo);
      formData.append('dob', form.dob);
      formData.append('education', form.education);
      formData.append('occupation', form.occupation);
      formData.append('address', form.address);
      formData.append('house_no', form.houseNo);
      formData.append('village', form.village);
      formData.append('mandal', form.mandal);
      formData.append('district', form.district);
      formData.append('pin', form.pin);
      formData.append('role', form.role);
      formData.append('location', form.location);
      formData.append('membership_category', form.membershipCategory);
      formData.append('membership_duration', form.membershipDuration);
      formData.append('membership_amount', form.membershipAmount);
      formData.append('status', form.status);
      
      if (form.receipt) formData.append('receipt', form.receipt);

      const res = await fetch('/api/add-member', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // EmailJS Automation - Send Welcome Email to the NEW MEMBER
      await sendWelcomeEmail(form.name, form.email, user?.fullName || 'SPHOORTHI KUTUMBAM Admin');
      
      toast.success('Member Registered Successfully!');
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1400);

    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Error saving person.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.headerContainer}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Dashboard
        </button>

        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>MEMBERSHIP CARD</h1>
          <p className={styles.pageSubtitle}>Register new member for SPHOORTHI KUTUMBAM TELANGANA - WARANGAL DIVISION.</p>
        </div>
      </div>

      {success && (
        <div className={styles.successBanner}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '8px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
          Person added successfully! Redirecting to dashboard…
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* ---- Photo Upload Sections ---- */}
        <div className={styles.photoSection}>
          <div className={styles.photoItem}>
            <label className={styles.photoLabel}>Payment Receipt *</label>
            <div
              className={styles.photoBox}
              onClick={() => receiptRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && receiptRef.current?.click()}
            >
              {form.receiptPreview ? (
                <Image src={form.receiptPreview} alt="Receipt Preview" width={110} height={110} className={styles.photoPreview} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <span className={styles.photoIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="10" x2="17" y2="10"/><line x1="7" y1="14" x2="13" y2="14"/></svg>
                  </span>
                  <span className={styles.photoHint}>Upload Receipt</span>
                </div>
              )}
            </div>
            {form.receiptPreview && (
              <div className={styles.photoActions}>
                <button type="button" onClick={() => receiptRef.current?.click()} className={styles.btnSmall}>Change</button>
                <button type="button" onClick={() => removePhoto('receipt')} className={styles.btnSmallDanger}>Remove</button>
              </div>
            )}
            <input ref={receiptRef} type="file" accept="image/*" className={styles.fileInput} onChange={e => handlePhoto(e, 'receipt')} />
            {errors.receipt && <p className={styles.error}>{errors.receipt}</p>}
          </div>
        </div>

        {/* ---- Fields Grid ---- */}
        <div className={styles.grid}>
          <Field label="Full Name *" error={errors.name}>
            <input className={styles.input} type="text" placeholder="Full Name" value={form.name || ''} onChange={e => set('name', e.target.value)} />
          </Field>

          <Field label="Father Name">
            <input className={styles.input} type="text" placeholder="Father Name" value={form.fatherName || ''} onChange={e => set('fatherName', e.target.value)} />
          </Field>

          <Field label="Aadhar Number" error={errors.aadharNo}>
            <input className={styles.input} type="text" placeholder="12 Digit Aadhar" value={form.aadharNo || ''} onChange={e => set('aadharNo', e.target.value)} />
          </Field>

          <Field label="PAN Card Number" error={errors.panNo}>
            <input className={styles.input} type="text" placeholder="10 Digit PAN" value={form.panNo || ''} onChange={e => set('panNo', e.target.value)} />
          </Field>

          <Field label="Date of Birth">
            <input className={styles.input} type="date" value={form.dob || ''} onChange={e => set('dob', e.target.value)} />
          </Field>

          <Field label="Phone Number *" error={errors.phone}>
            <input className={styles.input} type="tel" placeholder="10 Digit Mobile" value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
          </Field>

          <Field label="Email Address *" error={errors.email}>
            <input className={styles.input} type="email" placeholder="email@example.com" value={form.email || ''} onChange={e => set('email', e.target.value)} />
          </Field>

          <Field label="Education">
            <input className={styles.input} type="text" placeholder="Highest Education" value={form.education || ''} onChange={e => set('education', e.target.value)} />
          </Field>

          <Field label="Occupation">
            <input className={styles.input} type="text" placeholder="Job / Profession" value={form.occupation || ''} onChange={e => set('occupation', e.target.value)} />
          </Field>

          {/* ---- Address Section ---- */}
          <div className={styles.sectionTitle}>Permanent Address (Optional)</div>
          <Field label="Address / Lane (Optional)" className={styles.fullCol}>
            <input className={styles.input} type="text" placeholder="House No, Street, Landmark" value={form.address || ''} onChange={e => set('address', e.target.value)} />
          </Field>

          <Field label="H.No (Optional)">
            <input className={styles.input} type="text" placeholder="House Number" value={form.houseNo || ''} onChange={e => set('houseNo', e.target.value)} />
          </Field>

          <Field label="Village / Town *" error={errors.village}>
            <input className={styles.input} type="text" placeholder="Village or Town" value={form.village || ''} onChange={e => set('village', e.target.value)} />
          </Field>

          <Field label="Mandal *" error={errors.mandal}>
            <input className={styles.input} type="text" placeholder="Mandal" value={form.mandal || ''} onChange={e => set('mandal', e.target.value)} />
          </Field>

          <Field label="District *" error={errors.district}>
            <input className={styles.input} type="text" placeholder="District" value={form.district || ''} onChange={e => set('district', e.target.value)} />
          </Field>

          <Field label="Pincode *" error={errors.pin}>
            <input className={styles.input} type="text" placeholder="6 Digit PIN" value={form.pin || ''} onChange={e => set('pin', e.target.value)} />
          </Field>

          <Field label="State / Location (Optional)">
            <input className={styles.input} type="text" placeholder="State/Location" value={form.location || ''} onChange={e => set('location', e.target.value)} />
          </Field>

          {/* ---- Membership Section ---- */}
          <div className={styles.sectionTitle}>Membership Status</div>
          <Field label="Membership Category *" error={errors.membershipCategory}>
            <select className={styles.input} value={form.membershipCategory || ''} onChange={e => set('membershipCategory', e.target.value)}>
              <option value="">Select Category</option>
              <option value="Adult Member">Adult Member</option>
              <option value="Young Member">Young Member (&lt;18 Years)</option>
              <option value="Life Member">Life Member</option>
            </select>
          </Field>

          <Field label="Duration">
            {form.membershipCategory === 'Life Member' ? (
              <input className={styles.input} value="Life" readOnly />
            ) : (
              <select className={styles.input} value={form.membershipDuration || ''} onChange={e => set('membershipDuration', e.target.value)}>
                <option value="">Select Duration</option>
                <option value="1 Year">1 Year</option>
                <option value="2 Year">2 Year</option>
                <option value="5 Year">5 Year</option>
              </select>
            )}
          </Field>

          <Field label="Membership Fee">
            <div className={styles.amountDisplay}>₹ {form.membershipAmount || '0'}</div>
          </Field>

          <Field label="Administrative Role">
            <select className={styles.input} value={form.role || ''} onChange={e => set('role', e.target.value)}>
              <option value="">Select a role (Optional)</option>
              {['Coordinator', 'Volunteer', 'Member', 'Admin', 'Observer'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <div className={styles.radioGroup}>
              {(['Active', 'Inactive', 'Pending'] as const).map(s => (
                <label key={s} className={`${styles.radioLabel} ${form.status === s ? styles.radioSelected : ''}`}>
                  <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => set('status', s)} className={styles.radioInput} />
                  {s}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Bio / Notes" className={styles.fullCol}>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Optional short bio or notes about this person…"
              rows={2}
              value={form.bio || ''}
              onChange={e => set('bio', e.target.value)}
            />
          </Field>
        </div>

        {/* ---- Actions ---- */}
        <div className={styles.actions}>
          <button type="button" className={styles.btnCancel} onClick={() => router.push('/dashboard')}>
            Cancel
          </button>
          <button type="submit" className={styles.btnSubmit} disabled={submitting}>
            {submitting ? <span className={styles.spinner} /> : null}
            {submitting ? 'Saving…' : 'Add Person'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---- Helper Field wrapper ----
function Field({
  label, children, error, className = '',
}: {
  label: string; children: React.ReactNode; error?: string; className?: string;
}) {
  return (
    <div className={`${styles.field} ${className}`}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
