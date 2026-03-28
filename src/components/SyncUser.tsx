'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function SyncUser() {
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    async function sync() {
      if (!isLoaded || !isSignedIn || !user) return;

      const body = {
        clerk_user_id: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        first_name: user.firstName,
        last_name: user.lastName,
        full_name: user.fullName,
        profile_image: user.imageUrl,
        status: 'active'
      };

      try {
        const res = await fetch('/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);
        console.log('✓ User profile synced via API (Admin Bypass)');
      } catch (err: any) {
        console.error('Error syncing user profile:', err.message);
      }
    }

    sync();
  }, [isLoaded, isSignedIn, user]);

  return null;
}
