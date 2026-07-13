import { NextRequest, NextResponse } from 'next/server';
import { askGeminiForJSON } from '@/lib/ai/gemini-client';
import { buildRecommendPrompt } from '@/lib/ai/prompts';
import { RecommendationItem } from '@/lib/types/rab';

export const runtime = 'nodejs';

interface AdjustedItemInput {
  itemId: string;
  uraian: string;
  volumeAwal: number;
  volumeBaru: number;
  jawabanUser?: string;
  hargaMaterial?: number | null;
  hargaUpah?: number | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const adjustedItems: AdjustedItemInput[] = body.adjustedItems;

    if (!Array.isArray(adjustedItems) || adjustedItems.length === 0) {
      return NextResponse.json({ error: 'Daftar item yang disesuaikan tidak valid.' }, { status: 400 });
    }

    // Hanya kirim item yang volumenya beneran berubah
    const changedItems = adjustedItems.filter((i) => i.volumeBaru !== i.volumeAwal);

    if (changedItems.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const { system, user } = buildRecommendPrompt(changedItems);
    const aiResult = await askGeminiForJSON<RecommendationItem[]>(system, user);

    // Hitung estimasi penghematan Rupiah secara matematis (bukan dari AI, biar akurat)
    const recommendations: RecommendationItem[] = aiResult.map((rec) => {
      const original = changedItems.find((i) => i.itemId === rec.itemId);
      let estimasiPenghematan: number | null = null;

      if (original) {
        const hargaSatuan = (original.hargaMaterial ?? 0) + (original.hargaUpah ?? 0);
        const selisihVolume = original.volumeAwal - original.volumeBaru;
        estimasiPenghematan = hargaSatuan > 0 ? Math.round(hargaSatuan * selisihVolume) : null;
      }

      return { ...rec, estimasiPenghematan };
    });

    const totalPenghematan = recommendations.reduce((sum, r) => sum + (r.estimasiPenghematan ?? 0), 0);

    return NextResponse.json({ recommendations, totalPenghematan });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat generate rekomendasi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
