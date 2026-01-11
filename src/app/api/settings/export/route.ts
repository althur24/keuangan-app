import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/session';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient();

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', session.userId)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'Tidak ada data untuk diexport' }, { status: 400 });
        }

        // Convert to CSV
        const headers = ['Date', 'Type', 'Category', 'Amount', 'Description', 'Source'];
        const csvRows = [headers.join(',')];

        data.forEach(t => {
            csvRows.push([
                t.date,
                t.type,
                t.category,
                t.amount,
                `"${(t.description || '').replace(/"/g, '""')}"`, // Escape quotes
                t.source
            ].join(','));
        });

        const csvContent = csvRows.join('\n');

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="transactions_export_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
