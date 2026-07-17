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

    const flexibleItems = items.filter((item) => item.status === 'flexible');

    const sortedFlexibleItems = flexibleItems.sort((a, b) => {
      const totalPriceA = (a.volume || 0) * ((a.hargaMaterial || 0) + (a.hargaUpah || 0));
      const totalPriceB = (b.volume || 0) * ((b.hargaMaterial || 0) + (b.hargaUpah || 0));
      return totalPriceB - totalPriceA;
    });

    const topItemsToAnalyze = sortedFlexibleItems.slice(0, 10);
    const finalItemsToProcess = topItemsToAnalyze.length > 0 ? topItemsToAnalyze : items.slice(0, 10);

    const { system, user } = buildQuestionsPrompt(finalItemsToProcess);
    const generatedQuestions = await askGeminiForJSON<RABQuestion[]>(system, user);

    const limitedQuestions = Array.isArray(generatedQuestions) 
      ? generatedQuestions.slice(0, 5) 
      : [];

    return NextResponse.json({ questions: limitedQuestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat generate pertanyaan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}