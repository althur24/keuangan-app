import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/session';

// GET - Fetch all budgets for current user
export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient();
        const { data, error } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', session.userId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ budgets: data || [] });
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST - Create or update a budget
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { category, amount, period } = await req.json();

        if (!category || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid category or amount' }, { status: 400 });
        }

        // Valid periods: 'weekly', 'monthly', 'none' (default: 'monthly')
        const validPeriod = ['weekly', 'monthly', 'none'].includes(period) ? period : 'monthly';

        const supabase = createClient();

        // Upsert: Insert or update if exists
        const { data, error } = await supabase
            .from('budgets')
            .upsert({
                user_id: session.userId,
                category: category.toLowerCase(),
                amount: Math.round(amount),
                period: validPeriod,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,category'
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ budget: data });
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE - Remove a budget
export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        if (!category) {
            return NextResponse.json({ error: 'Category required' }, { status: 400 });
        }

        const supabase = createClient();
        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('user_id', session.userId)
            .eq('category', category.toLowerCase());

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
