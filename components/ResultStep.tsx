'use client';

import { useEffect, useState } from 'react';
import { RecommendationItem } from '@/lib/types/rab';
import { formatRupiah } from '@/lib/utils/format';

interface AdjustedItemInput {
  itemId: string;
  uraian: string;
  volumeAwal: number;
  volumeBaru: number;
  jawabanUser?: string;
  hargaMaterial: number | null;
  hargaUpah: number | null;
}

interface Props {
  adjustedItems: AdjustedItemInput[];
  budgetTarget: number;
  onRestart: () => void;
  onBack: () => void;
}

export default function ResultStep({ adjustedItems, budgetTarget, onRestart, onBack }: Props) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [totalPenghematan, setTotalPenghematan] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecommendations() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adjustedItems }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal generate rekomendasi.');
        setRecommendations(data.recommendations ?? []);
        setTotalPenghematan(data.totalPenghematan ?? 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      } finally {
        setLoading(false);
      }
    }
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="grid min-h-[55vh] place-items-center text-center"><div><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-100 border-t-[var(--orange)]" /><p className="eyebrow mt-6">Merapikan lembar hasil</p><h2 className="display-type mt-3 text-3xl text-[var(--blueprint)]">Menyusun rekomendasi akhir.</h2><p className="mt-3 text-sm text-[var(--muted)]">Perubahan volume sedang diterjemahkan menjadi catatan teknis.</p></div></div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="eyebrow !text-[var(--red)]">Rekomendasi terhenti</p>
        <h2 className="display-type mt-2 text-3xl text-[var(--ink)]">Lembar hasil belum dapat dibuat.</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--red)]">{error}</p>
        <button onClick={onBack} className="secondary-button mt-5">Kembali dan periksa volume</button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="grid min-h-[55vh] place-items-center text-center">
        <div className="max-w-lg"><p className="eyebrow">Belum ada revisi</p><h2 className="display-type mt-3 text-4xl text-[var(--blueprint)]">Volume tetap seperti dokumen awal.</h2><p className="mt-4 text-sm leading-6 text-[var(--muted)]">Tidak ada item fleksibel yang diubah. Kembali untuk meninjau volume, atau mulai sesi baru dengan dokumen lain.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={onBack} className="secondary-button">Tinjau kembali</button><button onClick={onRestart} className="primary-button">Buka RAB baru</button></div></div>
      </div>
    );
  }

  const targetTercapai = budgetTarget > 0 && totalPenghematan >= budgetTarget;
  const progress = budgetTarget > 0 ? Math.min(100, Math.max(0, (totalPenghematan / budgetTarget) * 100)) : 0;

  return (
    <div>
      <p className="eyebrow">Tahap 04 · Lembar rekomendasi</p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="display-type text-4xl leading-tight text-[var(--blueprint)] sm:text-5xl">Hasil optimasi siap ditinjau.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{recommendations.length} item berubah. Terapkan usulan ini secara manual setelah verifikasi teknis terhadap gambar kerja dan kondisi lapangan.</p></div><span className="rounded-full bg-[var(--orange-soft)] px-3 py-1.5 data-type text-xs font-bold text-orange-900">{recommendations.length} REVISI</span></div>

      <div className="mt-7 rounded-2xl bg-[var(--blueprint)] p-5 text-white sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-xs text-sky-100/65">Total estimasi penghematan</div><div className="data-type mt-2 text-3xl font-bold text-emerald-300 sm:text-4xl">{formatRupiah(totalPenghematan)}</div></div>
        {budgetTarget > 0 && (
          <div className={`rounded-lg px-3 py-2 text-sm font-bold ${targetTercapai ? 'bg-emerald-400/15 text-emerald-200' : 'bg-orange-400/15 text-orange-200'}`}>
            {targetTercapai
              ? 'Target pengurangan tercapai'
              : `Masih kurang ${formatRupiah(budgetTarget - totalPenghematan)} dari target`}
          </div>
        )}</div>
        {budgetTarget > 0 && <div className="mt-5"><div className="mb-2 flex justify-between data-type text-[10px] text-sky-100/60"><span>PROGRES TARGET</span><span>{progress.toFixed(0)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[var(--orange)]" style={{ width: `${progress}%` }} /></div></div>}
      </div>

      <div className="mt-5 space-y-3 mb-7">
        {recommendations.map((rec, index) => (
          <article key={rec.itemId} className="rounded-xl border border-[var(--line)] bg-white p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <div className="flex gap-3"><span className="data-type grid h-7 w-7 shrink-0 place-items-center rounded-md bg-sky-50 text-[10px] font-bold text-[var(--blueprint-bright)]">{String(index + 1).padStart(2, '0')}</span><span className="text-sm font-bold text-[var(--ink)]">{rec.uraian}</span></div>
              {rec.estimasiPenghematan !== null && (
                <span className="data-type whitespace-nowrap text-sm font-bold text-[var(--green)]">{formatRupiah(rec.estimasiPenghematan)}</span>
              )}
            </div>
            <div className="ml-0 mt-3 grid gap-3 border-t border-[var(--line)] pt-3 sm:ml-10 sm:grid-cols-[150px_1fr]"><div><p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Perubahan volume</p><p className="data-type mt-1 text-sm font-bold">{rec.volumeAwal} → {rec.volumeUsulan}</p></div><div><p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Justifikasi</p><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{rec.catatan}</p></div></div>
          </article>
        ))}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:justify-between">
        <button onClick={onBack} className="secondary-button">Perbaiki volume</button>
        <button onClick={onRestart} className="primary-button">Buka RAB baru</button>
      </div>
    </div>
  );
}
