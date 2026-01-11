import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/client';
import { createSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
        }

        const supabase = createClient();

        // Get user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
        }

        // Create Session
        const session = await createSession({ userId: user.id, email: user.email, name: user.name });

        // Set Cookie
        const cookieStore = await cookies();
        cookieStore.set('session', session, {
            httpOnly: true,
            secure: false, // Set to false for HTTP, change to true if using HTTPS
            sameSite: 'lax',
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            path: '/',
        });

        return NextResponse.json({ user });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
