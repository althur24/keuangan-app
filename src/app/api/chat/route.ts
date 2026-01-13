import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

const SYSTEM_PROMPT = `
Kamu adalah asisten keuangan AI berbahasa Indonesia yang TEGAS dan EFISIEN.

ATURAN FORMAT RESPONS SANGAT PENTING:
- JANGAN gunakan formatting markdown seperti ** atau * atau backtick
- JANGAN buat penjelasan panjang
- Respons harus SINGKAT, maksimal 1-2 kalimat
- Langsung catat transaksi tanpa bertanya balik

KATEGORI PENGELUARAN:
fnb, transport, belanja, hiburan, tagihan, kesehatan, pendidikan, liburan, pulsa, hadiah, rumah, lainnya

KATEGORI PEMASUKAN:
gaji, investasi, bonus

FORMAT RESPONS (WAJIB DIIKUTI):
[Konfirmasi 1 kalimat saja, TANPA formatting]

[JSON]
{"type":"expense/income","category":"kategori","amount":angka,"description":"deskripsi","date":null}
[/JSON]

CONTOH BENAR:
User: "makan soto 15rb"
Respons: Pengeluaran makan soto Rp15.000 sudah dicatat!

[JSON]
{"type":"expense","category":"fnb","amount":15000,"description":"Makan soto","date":null}
[/JSON]

User: "gaji 5 juta"
Respons: Pemasukan gaji Rp5.000.000 sudah dicatat!

[JSON]
{"type":"income","category":"gaji","amount":5000000,"description":"Gaji","date":null}
[/JSON]

UNTUK AUDIO/SUARA:
- Dengarkan dan pahami isi audio
- Ekstrak informasi transaksi dari audio
- Jika tidak bisa memahami audio, respons: "Maaf, audio tidak jelas. Coba ketik manual."
`;

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Support both schemas: 'data' (new) or 'image' (old schema fallback)
        const { message, mimeType } = body;
        const data = body.data || body.image;

        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        // SELECT MODEL DYNAMICALLY
        // Using gemini-2.0-flash (stable, available for this API key)
        const modelName = "gemini-2.0-flash";

        const model = genAI.getGenerativeModel({ model: modelName });

        const parts: any[] = [];
        if (message) parts.push({ text: message });

        // Handle Media Input (Image or Audio)
        if (data && mimeType) {
            parts.push({
                inlineData: {
                    data: data,
                    mimeType: mimeType
                }
            });
            if (mimeType.startsWith('image/')) {
                parts.push({ text: "\n\n(Ekstrak data transaksi dari struk/gambar ini. Langsung catat tanpa bertanya.)" });
            } else if (mimeType.startsWith('audio/')) {
                parts.push({ text: "\n\n(Dengarkan audio ini dan ekstrak data transaksi. Langsung catat tanpa bertanya.)" });
            }
        }

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "Siap! Saya akan langsung mencatat transaksi tanpa bertanya balik." }],
                }
            ]
        });

        const result = await chat.sendMessage(parts);
        const response = await result.response;
        const text = response.text();

        // Try to extract JSON from the response (support both [JSON] tags and markdown code blocks)
        let transactionData = null;
        let replyText = text;

        // Try [JSON] format first
        let jsonMatch = text.match(/\[JSON\]\s*({[\s\S]*?})\s*\[\/JSON\]/);

        // If not found, try markdown code block format
        if (!jsonMatch) {
            jsonMatch = text.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
        }

        // If still not found, try to find raw JSON object
        if (!jsonMatch) {
            jsonMatch = text.match(/({[\s\S]*?"type"[\s\S]*?"amount"[\s\S]*?})/);
        }

        if (jsonMatch) {
            try {
                transactionData = JSON.parse(jsonMatch[1]);
                // Clean text by removing the JSON block
                replyText = text
                    .replace(/\[JSON\][\s\S]*?\[\/JSON\]/g, '')
                    .replace(/```(?:json)?[\s\S]*?```/g, '')
                    .replace(/{[\s\S]*?"type"[\s\S]*?"amount"[\s\S]*?}/g, '')
                    .trim();
            } catch (e) {
                console.error("Failed to parse JSON from AI response", e);
            }
        }

        return NextResponse.json({
            reply: replyText,
            transaction: transactionData
        });
    } catch (error: any) {
        console.error("Gemini Error:", error);
        // Fallback error message
        let errorMessage = "Failed: " + error.message;
        if (error.message.includes("404")) {
            errorMessage += " (Model not found. Please checks API Key permissions or Region.)";
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
