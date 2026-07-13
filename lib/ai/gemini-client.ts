import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | null = null;

/**
 * Lazy-init client biar ga crash pas build time kalau env var belum ke-set,
 * baru divalidasi pas beneran dipanggil saat runtime.
 */
function getClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY belum di-set. Tambahkan di file .env.local (lokal) atau Environment Variables (Vercel).'
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

const MODEL = 'gemini-2.5-flash';

/**
 * Panggil Gemini, minta output JSON murni lewat responseMimeType.
 * Tetap strip ```json fences sebagai fallback kalau ada.
 */
export async function askGeminiForJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini tidak mengembalikan respons teks.');
  }

  const cleaned = text.replace(/```json\s*|```\s*$/g, '').trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Gagal parse JSON dari respons Gemini: ${cleaned.slice(0, 200)}...`);
  }
}
