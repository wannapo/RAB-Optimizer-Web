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

  const [volumeBaru, setVolumeBaru] = useState<Record<string, number>>({});
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

        // default volumeBaru = volume awal
        const defaults: Record<string, number> = {};
        parsed.items.forEach((item) => {
          defaults[item.id] = item.volume;
        });
        setVolumeBaru(defaults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      } finally {
        setLoadingQuestions(false);
      }
    }
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPenghematanBerjalan = parsed.items.reduce((sum, item) => {
    if (item.status !== 'flexible') return sum;
    const vBaru = volumeBaru[item.id] ?? item.volume;
    const selisihVolume = item.volume - vBaru;
    const harga = hargaSatuan(item.hargaMaterial, item.hargaUpah);
    return sum + selisihVolume * harga;
  }, 0);
  const flexibleItems = useMemo(() => parsed.items.filter((item) => item.status === 'flexible'), [parsed.items]);
  const changedCount = flexibleItems.filter((item) => (volumeBaru[item.id] ?? item.volume) !== item.volume).length;
  const progress = budgetTarget > 0 ? Math.min(100, Math.max(0, (totalPenghematanBerjalan / budgetTarget) * 100)) : 0;

  function handleFinish() {
    const adjustedItems = parsed.items
      .filter((item) => item.status === 'flexible')
      .map((item) => ({
        itemId: item.id,
        uraian: item.uraian,
        volumeAwal: item.volume,
        volumeBaru: volumeBaru[item.id] ?? item.volume,
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
          <h2 className="display-type mt-3 text-3xl text-[var(--blueprint)]">Menyusun pertanyaan untuk {parsed.items.length} item.</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">Item diproses per kelompok agar rekomendasinya tetap relevan.</p>
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
        <span className="data-type whitespace-nowrap text-xs text-[var(--muted)]">{changedCount}/{flexibleItems.length} item diubah</span>
      </div>

      <div className="sticky top-3 z-20 mt-7 rounded-2xl border border-sky-900/10 bg-[var(--blueprint)] p-4 text-white shadow-xl shadow-sky-950/10 sm:p-5">
        <div className="flex items-end justify-between gap-5"><div><p className="text-xs text-sky-100/65">Penghematan berjalan</p><p className="data-type mt-1 text-xl font-bold text-emerald-300 sm:text-2xl">{formatRupiah(totalPenghematanBerjalan)}</p></div>{budgetTarget > 0 && <div className="text-right"><p className="text-xs text-sky-100/65">Target pengurangan</p><p className="data-type mt-1 text-sm font-bold">{formatRupiah(budgetTarget)}</p></div>}</div>
        {budgetTarget > 0 && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[var(--orange)] transition-[width]" style={{ width: `${progress}%` }} /></div>}
      </div>

      <div className="mt-5 space-y-3 mb-6">
        {parsed.items.map((item) => {
          const q = questions[item.id];
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
                {q && (
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
                )}
              </div>
            );
          }

          const vBaru = volumeBaru[item.id] ?? item.volume;
          const harga = hargaSatuan(item.hargaMaterial, item.hargaUpah);
          const estimasi = (item.volume - vBaru) * harga;

          return (
            <div key={item.id} className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col justify-between gap-2 text-sm sm:flex-row">
                <div><span className="mb-2 inline-block rounded-full bg-emerald-100 px-2 py-1 data-type text-[10px] font-bold uppercase text-emerald-800">Dapat ditinjau · {item.kategori}</span><p className="font-bold text-[var(--ink)]">{item.uraian}</p></div>
                <span className="data-type whitespace-nowrap text-[var(--muted)]">
                  awal: {item.volume} {item.satuan}
                </span>
              </div>
              {q && <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2.5 text-xs leading-5 text-sky-900">{q.question}</p>}

              <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr] sm:items-end">
                <label className="text-xs font-bold text-[var(--muted)]">Volume usulan
                <div className="mt-1 flex items-center"><input
                  type="number"
                  value={vBaru}
                  min="0"
                  step="any"
                  onChange={(e) =>
                    setVolumeBaru((prev) => ({ ...prev, [item.id]: Math.max(0, Number(e.target.value)) }))
                  }
                  className="field data-type rounded-r-none px-3 py-2 text-sm"
                /><span className="rounded-r-lg border border-l-0 border-[#b8c8ce] bg-[#eef3f5] px-3 py-2 text-xs">{item.satuan}</span></div></label>
                <input
                  type="text"
                  aria-label={`Catatan untuk ${item.uraian}`}
                  placeholder="Alasan atau kondisi lapangan (opsional)"
                  value={jawaban[item.id] ?? ''}
                  onChange={(e) => setJawaban((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  className="field px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-3 min-h-5 text-right">
                {harga > 0 && estimasi !== 0 && (
                  <span className={`data-type text-xs font-bold ${estimasi > 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                    {estimasi > 0 ? 'hemat ' : 'bertambah '}{formatRupiah(Math.abs(estimasi))}
                  </span>
                )}
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
        >
          Susun {changedCount > 0 ? `${changedCount} ` : ''}rekomendasi
        </button>
      </div>
    </div>
  );
}
