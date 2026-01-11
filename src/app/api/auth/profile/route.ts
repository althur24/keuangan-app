import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/session';

export async function PATCH(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Nama tidak boleh kosong' }, { status: 400 });
        }

        const supabase = createClient();

        const { error } = await supabase
            .from('users')
            .update({ name })
            .eq('id', session.userId);

        if (error) {
            console.error('Update Profile Error:', error);
            return NextResponse.json({ error: 'Gagal update profil' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
