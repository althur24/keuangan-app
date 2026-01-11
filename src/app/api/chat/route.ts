import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

const SYSTEM_PROMPT = `
Kamu adalah asisten keuangan AI berbahasa Indonesia yang TEGAS dan EFISIEN.

KATEGORI YANG TERSEDIA (WAJIB GUNAKAN SALAH SATU, JANGAN BUAT KATEGORI BARU):

PENGELUARAN:
- "fnb" = Makanan & Minuman (makan, minum, kopi, snack, restoran, warteg, dll)
- "transport" = Transportasi (bensin, ojol, parkir, tol, grab, gojek, bus, kereta)
- "belanja" = Belanja (baju, sepatu, elektronik, furniture, online shop)
- "hiburan" = Hiburan (nonton, game, konser, karaoke, liburan kecil)
- "tagihan" = Tagihan & Utilitas (listrik, air, internet, wifi, iuran)
- "kesehatan" = Kesehatan (obat, dokter, rumah sakit, vitamin)
- "pendidikan" = Pendidikan (kursus, buku, sekolah, les)
- "liburan" = Liburan & Wisata (hotel, tiket pesawat, tour)
- "pulsa" = Pulsa & Data (pulsa, paket data, top up)
- "hadiah" = Hadiah & Donasi (kado, sumbangan, zakat)
- "rumah" = Keperluan Rumah (sabun, alat rumah, perabotan kecil)
- "lainnya" = Lainnya (jika tidak masuk kategori manapun)

PEMASUKAN:
- "gaji" = Gaji (gaji bulanan, THR)
- "investasi" = Investasi (dividen, return investasi, bunga)
- "bonus" = Bonus (bonus kerja, hadiah uang, cashback)

ATURAN PENTING:
1. JANGAN PERNAH bertanya balik. Langsung catat saja.
2. WAJIB gunakan SALAH SATU kategori di atas. JANGAN PERNAH buat kategori baru.
3. Jika ragu, pilih kategori terdekat atau gunakan "lainnya".
4. Selalu ASUMSIKAN mata uang IDR (Rupiah) kecuali disebutkan lain.
5. Tanggal: gunakan null jika tidak disebutkan.
6. Berikan konfirmasi singkat dan langsung tampilkan data transaksi.

FORMAT RESPONS:
[Konfirmasi singkat dalam 1 kalimat]

[JSON]
{
  "type": "expense" atau "income",
  "category": "HARUS salah satu dari daftar di atas",
  "amount": angka_tanpa_format,
  "description": "deskripsi singkat",
  "date": "YYYY-MM-DD" atau null
}
[/JSON]

CONTOH:
User: "makan soto 15rb"
Response: "Pengeluaran untuk makan soto sebesar Rp15.000 sudah dicatat!"

[JSON]
{"type":"expense","category":"fnb","amount":15000,"description":"Makan soto","date":null}
[/JSON]

User: "beli baju 200rb"
Response: "Pengeluaran untuk beli baju sebesar Rp200.000 sudah dicatat!"

[JSON]
{"type":"expense","category":"belanja","amount":200000,"description":"Beli baju","date":null}
[/JSON]
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
        // Using gemini-1.5-flash (stable, supports more regions including Indonesia)
        const modelName = "gemini-1.5-flash";

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
