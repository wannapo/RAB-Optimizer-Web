import { NextRequest, NextResponse } from 'next/server';
import { askGeminiForJSON } from '@/lib/ai/gemini-client';
import { buildQuestionsPrompt } from '@/lib/ai/prompts';
import { RABItem, RABQuestion } from '@/lib/types/rab';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: RABItem[] = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Daftar item tidak valid.' }, { status: 400 });
    }

    // Batch per 20 item biar prompt ga kepanjangan & response lebih stabil
    const BATCH_SIZE = 20;
    const batches: RABItem[][] = [];
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      batches.push(items.slice(i, i + BATCH_SIZE));
    }

    const results = await Promise.all(
      batches.map(async (batch) => {
        const { system, user } = buildQuestionsPrompt(batch);
        return askGeminiForJSON<RABQuestion[]>(system, user);
      })
    );

    const questions = results.flat();

    return NextResponse.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat generate pertanyaan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
