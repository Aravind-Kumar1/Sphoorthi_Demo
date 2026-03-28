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
  email: string;
  phone: string;
  role: string;
  location: string;
  joinedDate: string;
  status: 'Active' | 'Inactive' | 'Pending';
  bio: string;
  photo: File | null;
  photoPreview: string | null;
};

const INITIAL: FormData = {
  name: '', email: '', phone: '', role: '', location: '',
  joinedDate: new Date().toISOString().split('T')[0],
  status: 'Active', bio: '', photo: null, photoPreview: null,
};


export default function AddPersonPage() {
  const router = useRouter();
  const { user } = useUser();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof FormData, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(err => ({ ...err, photo: 'Please upload a valid image file.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(err => ({ ...err, photo: 'Image must be under 5 MB.' }));
      return;
    }
    const url = URL.createObjectURL(file);
    setForm(f => ({ ...f, photo: file, photoPreview: url }));
    setErrors(err => ({ ...err, photo: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim())    e.name  = 'Full name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                               e.email = 'A valid email is required.';
    if (!form.phone.trim())   e.phone = 'Phone number is required.';
    if (!form.role.trim())    e.role  = 'Role is required.';
    if (!form.location.trim()) e.location = 'Location is required.';
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
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('role', form.role);
      formData.append('location', form.location);
      formData.append('status', form.status);
      if (form.photo) {
        formData.append('photo', form.photo);
      }

      const res = await fetch('/api/add-member', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // EmailJS Automation - Send Welcome/Thank You Email
      await sendWelcomeEmail(form.name, form.email);
      
      toast.success('Member Registered Successfully!');
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1400);

    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Error saving person.');
      setErrors(e => ({ ...e, photo: err.message || 'Error saving person.' }));
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className={styles.page}>
      {/* Back */}
      <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Dashboard
      </button>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Add New Person</h1>
        <p className={styles.pageSubtitle}>Fill in the details below and upload a photo to register a new member.</p>
      </div>

      {success && (
        <div className={styles.successBanner}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '8px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
          Person added successfully! Redirecting to dashboard…
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* ---- Photo Upload ---- */}
        <div className={styles.photoSection}>
          <div
            className={styles.photoBox}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
          >
            {form.photoPreview ? (
              <Image
                src={form.photoPreview}
                alt="Preview"
                width={110}
                height={110}
                className={styles.photoPreview}
              />
            ) : (
              <div className={styles.photoPlaceholder}>
                <span className={styles.photoIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                </span>
                <span className={styles.photoHint}>Upload photo</span>
                <span className={styles.photoSub}>JPG, PNG, WEBP</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={handlePhoto}
          />
          {form.photoPreview && (
            <button
              type="button"
              className={styles.removePhoto}
              onClick={() => setForm(f => ({ ...f, photo: null, photoPreview: null }))}
            >
              Remove photo
            </button>
          )}
          {errors.photo && <p className={styles.error}>{errors.photo}</p>}
        </div>

        {/* ---- Fields Grid ---- */}
        <div className={styles.grid}>
          <Field label="Full Name *" error={errors.name}>
            <input className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              type="text" placeholder="e.g. Arjun Sharma"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>

          <Field label="Email Address *" error={errors.email}>
            <input className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              type="email" placeholder="e.g. arjun@example.com"
              value={form.email} onChange={e => set('email', e.target.value)} />
          </Field>

          <Field label="Phone Number *" error={errors.phone}>
            <input className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
              type="tel" placeholder="+91 98765 43210"
              value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>

          <Field label="Role *" error={errors.role}>
            <select className={`${styles.input} ${errors.role ? styles.inputError : ''}`}
              value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="">Select a role…</option>
              {['Coordinator', 'Volunteer', 'Member', 'Admin', 'Observer'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>

          <Field label="Location *" error={errors.location}>
            <input className={`${styles.input} ${errors.location ? styles.inputError : ''}`}
              type="text" placeholder="e.g. Hyderabad"
              value={form.location} onChange={e => set('location', e.target.value)} />
          </Field>

          <Field label="Date Joined" error={errors.joinedDate}>
            <input className={styles.input}
              type="date"
              value={form.joinedDate} onChange={e => set('joinedDate', e.target.value)} />
          </Field>

          <Field label="Status">
            <div className={styles.radioGroup}>
              {(['Active', 'Inactive', 'Pending'] as const).map(s => (
                <label key={s} className={`${styles.radioLabel} ${form.status === s ? styles.radioSelected : ''}`}>
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={form.status === s}
                    onChange={() => set('status', s)}
                    className={styles.radioInput}
                  />
                  {s}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Bio / Notes" className={styles.fullCol}>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Optional short bio or notes about this person…"
              rows={3}
              value={form.bio}
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
