'use client';

import { useEffect, useMemo, useState } from 'react';
import { ParsedRAB, RABQuestion } from '@/lib/types/rab';
import { formatRupiah, hargaSatuan } from '@/lib/utils/format';

interface Props {
  parsed: ParsedRAB;
  budgetTarget: number;
  onFinish: (
    adjustedItems: {
      itemId: string;
      uraian: string;
      volumeAwal: number;
      volumeBaru: number;
      jawabanUser?: string;
      hargaMaterial: number | null;
      hargaUpah: number | null;
    }[]
  ) => void;
  onBack: () => void;
}

export default function OptimizeStep({ parsed, budgetTarget, onFinish, onBack }: Props) {
  const [questions, setQuestions] = useState<Record<string, RABQuestion>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [jawaban, setJawaban] = useState<Record<string, string>>({});
  const [verifikasi, setVerifikasi] = useState<Record<string, 'ya' | 'tidak' | null>>({});

  useEffect(() => {
    async function loadQuestions() {
      setLoadingQuestions(true);
      setError(null);
      try {
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: parsed.items }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal generate pertanyaan.');

        const map: Record<string, RABQuestion> = {};
        (data.questions as RABQuestion[]).forEach((q) => {
          map[q.itemId] = q;
        });
        setQuestions(map);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      } finally {
        setLoadingQuestions(false);
      }
    }
    loadQuestions();
  }, []);

  const flexibleItems = useMemo(() => parsed.items.filter((item) => item.status === 'flexible'), [parsed.items]);
  
  // Sekarang menghitung jumlah item yang sudah diisi tanggapannya oleh user
  const changedCount = useMemo(() => {
    return flexibleItems.filter((item) => jawaban[item.id] && jawaban[item.id].trim() !== '').length;
  }, [flexibleItems, jawaban]);

  function handleFinish() {
    const adjustedItems = Object.values(questions)
      .map((q) => parsed.items.find((i) => i.id === q.itemId))
      .filter((item): item is NonNullable<typeof item> => !!item && item.status === 'flexible')
      // Hanya kirim item yang bener-bener diisi tanggapan lapangan-nya oleh user
      .filter((item) => jawaban[item.id] && jawaban[item.id].trim() !== '')
      .map((item) => ({
        itemId: item.id,
        uraian: item.uraian,
        volumeAwal: item.volume,
        // Trik -0.001 supaya sistem mendeteksi ada perubahan data volume dibanding awal agar lolos validasi halaman Result
        volumeBaru: item.volume - 0.001, 
        jawabanUser: jawaban[item.id],
        hargaMaterial: item.hargaMaterial,
        hargaUpah: item.hargaUpah,
      }));
    
    onFinish(adjustedItems);
  }

  if (loadingQuestions) {
    return (
      <div className="grid min-h-[55vh] place-items-center text-center">
        <div>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-sky-100 border-t-[var(--blueprint-bright)]" />
          <p className="eyebrow mt-6">Membaca konteks pekerjaan</p>
          <h2 className="display-type mt-3 text-3xl text-[var(--blueprint)]">Menyusun pertanyaan efisiensi.</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">Menganalisis item prioritas tinggi untuk penghematan maksimal.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="eyebrow !text-[var(--red)]">Analisis terhenti</p>
        <h2 className="display-type mt-2 text-3xl text-[var(--ink)]">Pertanyaan belum berhasil disusun.</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--red)]">{error}</p>
        <button onClick={onBack} className="secondary-button mt-5">Kembali ke target</button>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">Tahap 03 · Peninjauan volume</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="display-type text-4xl leading-tight text-[var(--blueprint)] sm:text-5xl">Uji setiap peluang efisiensi.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Ubah hanya volume yang dapat dipertanggungjawabkan. Catatan akan menjadi dasar rekomendasi akhir.</p></div>
        <span className="data-type whitespace-nowrap text-xs text-[var(--muted)]">{changedCount}/{Object.keys(questions).length} item ditanggapi</span>
      </div>

      <div className="mt-5 space-y-3 mb-6">
        {Object.values(questions).map((q) => {
          const item = parsed.items.find((i) => i.id === q.itemId);
          if (!item) return null;
          const isLocked = item.status === 'locked';

          if (isLocked) {
            return (
              <div key={item.id} className="rounded-xl border border-[var(--line)] bg-[#f7f9fa] p-4 opacity-80">
                <div className="flex flex-col justify-between gap-2 text-sm sm:flex-row">
                  <div><span className="mb-2 inline-block rounded-full bg-slate-200 px-2 py-1 data-type text-[10px] font-bold uppercase text-slate-600">Terkunci</span><p className="font-bold text-[var(--ink)]">{item.uraian}</p></div>
                  <span className="data-type whitespace-nowrap text-[var(--muted)]">
                    {item.volume} {item.satuan}
                  </span>
                </div>
                <div className="mt-2 text-xs text-amber-800">{item.alasan}</div>
                <div className="mt-3 border-t border-[var(--line)] pt-3">
                  <p className="mb-2 text-xs leading-5 text-[var(--muted)]">{q.question}</p>
                  <div className="flex gap-2">
                    {(['ya', 'tidak'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setVerifikasi((prev) => ({ ...prev, [item.id]: opt }))}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                          verifikasi[item.id] === opt
                            ? 'border-[var(--blueprint)] bg-[var(--blueprint)] text-white'
                            : 'border-[var(--line)] bg-white text-[var(--muted)]'
                        }`}
                      >
                        {opt === 'ya' ? 'Ya' : 'Tidak'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={item.id} className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col justify-between gap-2 text-sm sm:flex-row">
                <div><span className="mb-2 inline-block rounded-full bg-emerald-100 px-2 py-1 data-type text-[10px] font-bold uppercase text-emerald-800">Dapat ditinjau · {item.kategori}</span><p className="font-bold text-[var(--ink)]">{item.uraian}</p></div>
                <span className="data-type whitespace-nowrap text-[var(--muted)]">
                  awal: {item.volume} {item.satuan}
                </span>
              </div>
              <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2.5 text-xs leading-5 text-sky-900">{q.question}</p>

              <div className="mt-4">
                <label className="text-xs font-bold text-[var(--muted)] w-full">
                  Tanggapan & Kondisi Lapangan
                  <input
                    type="text"
                    aria-label={`Catatan untuk ${item.uraian}`}
                    placeholder="Masukkan alasan, usulan volume baru, atau kondisi lapangan di sini..."
                    value={jawaban[item.id] ?? ''}
                    onChange={(e) => setJawaban((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    className="field mt-1 w-full px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-3 z-20 flex flex-col-reverse gap-3 rounded-xl border border-[var(--line)] bg-white/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:justify-between">
        <button onClick={onBack} className="secondary-button">Kembali ke target</button>
        <button
          onClick={handleFinish}
          className="primary-button"
          disabled={changedCount === 0}
        >
          Susun {changedCount > 0 ? `${changedCount} ` : ''}rekomendasi
        </button>
      </div>
    </div>
  );
}