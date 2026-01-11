import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/client';
import { createSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
        }

        const supabase = createClient();

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const { data: user, error } = await supabase
            .from('users')
            .insert({
                email,
                password_hash: hashedPassword,
                name: name || email.split('@')[0], // Default name
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Insert Error:', error);
            return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 });
        }

        // Create Session
        const session = await createSession({ userId: user.id, email: user.email, name: user.name });

        // Set Cookie
        const cookieStore = await cookies();
        cookieStore.set('session', session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            path: '/',
        });

        return NextResponse.json({ user });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
