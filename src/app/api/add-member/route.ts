import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Get fields
    const fullName = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const role = formData.get('role') as string;
    const location = formData.get('location') as string;
    const status = formData.get('status') as string;
    const clerkUserId = formData.get('clerk_user_id') as string;
    const photoFile = formData.get('photo') as File | null;

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Missing ClerK user identification.' }, { status: 400 });
    }

    let photoUrl = null;

    // 1. Upload photo to Storage (Bypass RLS)
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop() || 'png';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${clerkUserId}/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('members-photos')
        .upload(filePath, photoFile, { contentType: photoFile.type });

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError.message);
        return NextResponse.json({ error: `Storage Error: ${uploadError.message}` }, { status: 500 });
      }

      const { data } = supabaseAdmin.storage
        .from('members-photos')
        .getPublicUrl(filePath);

      photoUrl = data.publicUrl;
    }

    // 2. Get the DB user record ID
    const { data: uData, error: uError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (uError) {
      return NextResponse.json({ error: 'Your user profile was not found. Try logging out and in again.' }, { status: 404 });
    }

    // 3. Insert member (Bypass RLS)
    const { error: insertError } = await supabaseAdmin
      .from('members')
      .insert({
        full_name: fullName,
        email: email,
        phone: phone,
        role: role,
        location: location,
        status: status,
        photo_url: photoUrl,
        added_by_user_id: uData.id
      });

    if (insertError) {
      console.error('Database Insert Error:', insertError.message);
      return NextResponse.json({ error: `Database Error: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('API Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
