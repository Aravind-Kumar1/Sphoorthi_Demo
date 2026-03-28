import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const userData = await req.json();

    if (!userData.clerk_user_id) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
    }

    // Smart Sync:
    // 1. Check if user with same email exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, clerk_user_id')
      .eq('email', userData.email)
      .single();

    let error;
    if (existingUser) {
      // Update by email (ensures we don't violate users_email_key)
      ({ error } = await supabaseAdmin.from('users').update({
        clerk_user_id: userData.clerk_user_id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: userData.full_name,
        profile_image: userData.profile_image,
        status: 'active'
      }).eq('email', userData.email));
    } else {
      // New user, upsert by clerk_user_id
      ({ error } = await supabaseAdmin.from('users').upsert({
        clerk_user_id: userData.clerk_user_id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: userData.full_name,
        profile_image: userData.profile_image,
        status: 'active'
      }, { onConflict: 'clerk_user_id' }));
    }

    if (error) {
      console.error('Admin sync error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User profile synced to Supabase (Admin Bypass)' });
  } catch (err: any) {
    console.error('API Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
