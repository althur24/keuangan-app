import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/session';

export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient();

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('user_id', session.userId);

        if (error) {
            console.error('Delete Data Error:', error);
            return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
