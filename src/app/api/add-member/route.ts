import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function uploadFile(bucket: string, file: File, clerkUserId: string) {
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${clerkUserId}/${fileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, file, { contentType: file.type });

  if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const clerkUserId = formData.get('clerk_user_id') as string;
    if (!clerkUserId) return NextResponse.json({ error: 'Missing user identification.' }, { status: 400 });

    // Extract all fields
    const fields = {
      full_name: formData.get('full_name'),
      father_name: formData.get('father_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      aadhar_no: formData.get('aadhar_no'),
      pan_no: formData.get('pan_no'),
      dob: formData.get('dob'),
      education: formData.get('education'),
      occupation: formData.get('occupation'),
      address: formData.get('address'),
      house_no: formData.get('house_no'),
      village: formData.get('village'),
      mandal: formData.get('mandal'),
      district: formData.get('district'),
      pin: formData.get('pin'),
      role: formData.get('role'),
      location: formData.get('location'),
      membership_category: formData.get('membership_category'),
      membership_duration: formData.get('membership_duration'),
      membership_amount: formData.get('membership_amount'),
      status: formData.get('status'),
    };

    // Upload Files
    const photoFile = formData.get('photo') as File | null;
    const receiptFile = formData.get('receipt') as File | null;
    
    let photo_url = null;
    let receipt_url = null;

    if (photoFile) photo_url = await uploadFile('members-photos', photoFile, clerkUserId);
    if (receiptFile) receipt_url = await uploadFile('members-receipts', receiptFile, clerkUserId);

    // Get DB User ID
    const { data: uData, error: uError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (uError) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });

    // Insert Member
    const { error: insertError } = await supabaseAdmin
      .from('members')
      .insert({
        ...fields,
        photo_url,
        receipt_url,
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
