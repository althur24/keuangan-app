export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'chat' | 'ocr' | 'voice' | 'manual';

export interface User {
    id: string;
    email: string;
    created_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    date: string;
    source: TransactionSource;
    created_at: string;
}

export interface AILog {
    id: string;
    user_id: string;
    prompt: string;
    response: string;
    tokens_used?: number;
    created_at: string;
}
