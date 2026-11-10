import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, nama_lengkap, role, adminId } = await req.json();

    // 1. Inisialisasi Supabase pakai Kunci Rahasia (Service Role)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 2. Cek siapa yang nembak API ini (Admin atau Superadmin?)
    const { data: adminProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', adminId).single();
    
    if (!adminProfile || (adminProfile.role !== 'ADMIN' && adminProfile.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Akses ditolak. Anda bukan Admin.' }, { status: 403 });
    }

    // 3. Logika Pembatasan Role
    let finalRole = 'WARGA';
    if (adminProfile.role === 'SUPERADMIN') {
      finalRole = role; // Superadmin bebas pilih role
    } else {
      if (role !== 'WARGA') {
        return NextResponse.json({ error: 'Admin biasa cuma bisa nambah Warga.' }, { status: 403 });
      }
    }

    // 4. Bikin Akun Baru Langsung Aktif
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Langsung aktif tanpa verifikasi email
      user_metadata: {
        nama_lengkap,
        role: finalRole,
        status: 'AKTIF' // Admin yang bikin berarti langsung AKTIF
      }
    });

    if (createError) throw createError;
    return NextResponse.json({ success: true, user: newUser });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}