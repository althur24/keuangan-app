import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { oldPassword, newPassword } = await req.json();

        if (!oldPassword || !newPassword) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
        }

        const supabase = createClient();

        // 1. Get current password hash
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('password_hash')
            .eq('id', session.userId)
            .single();

        if (fetchError || !user) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
        }

        // 2. Verify old password
        const isValid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isValid) {
            return NextResponse.json({ error: 'Password lama salah' }, { status: 400 });
        }

        // 3. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 4. Update password
        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: hashedPassword })
            .eq('id', session.userId);

        if (updateError) {
            return NextResponse.json({ error: 'Gagal update password' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Change Password Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
