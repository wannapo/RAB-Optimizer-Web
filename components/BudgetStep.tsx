'use client';

import { useMemo, useState } from 'react';
import { ParsedRAB } from '@/lib/types/rab';
import { calculateSavingsTarget } from '@/lib/utils/budget';
import { formatRupiah, hargaSatuan } from '@/lib/utils/format';

interface Props { parsed: ParsedRAB; onContinue: (savingsTarget: number) => void; onBack: () => void; }

export default function BudgetStep({ parsed, onContinue, onBack }: Props) {
  const [budgetInput, setBudgetInput] = useState('');
  const totalRAB = useMemo(() => parsed.items.reduce((sum, item) => sum + item.volume * hargaSatuan(item.hargaMaterial, item.hargaUpah), 0), [parsed.items]);
  const hasPriceData = totalRAB > 0;
  const desiredBudget = Number(budgetInput.replace(/[^0-9]/g, '')) || 0;
  const savingsTarget = calculateSavingsTarget(totalRAB, desiredBudget);
  const targetTooHigh = hasPriceData && desiredBudget > totalRAB;
  const canContinue = !hasPriceData || desiredBudget > 0;

  function handleInput(value: string) {
    const numeric = value.replace(/[^0-9]/g, '');
    setBudgetInput(numeric ? new Intl.NumberFormat('id-ID').format(Number(numeric)) : '');
  }

  return (
    <div>
      <p className="eyebrow">Tahap 02 · Sasaran biaya</p>
      <h2 className="display-type mt-3 text-4xl leading-tight text-[var(--blueprint)] sm:text-5xl">Tentukan garis finis anggaran.</h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">Masukkan nilai akhir RAB yang ingin dicapai. Sistem akan menghitung selisih yang perlu dihemat—bukan menyamakan target akhir dengan target pengurangan.</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--line)] bg-[#f7fafb] p-4"><p className="text-xs text-[var(--muted)]">Item terbaca</p><p className="data-type mt-2 text-2xl font-bold">{parsed.meta.totalItems}</p></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs text-emerald-700">Dapat ditinjau</p><p className="data-type mt-2 text-2xl font-bold text-[var(--green)]">{parsed.meta.flexibleCount}</p></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs text-amber-700">Volume terkunci</p><p className="data-type mt-2 text-2xl font-bold text-amber-800">{parsed.meta.lockedCount}</p></div>
      </div>

      <div className="mt-6 rounded-2xl bg-[var(--blueprint)] p-5 text-white sm:p-6">
        <div className="grid gap-6 sm:grid-cols-2 sm:items-end">
          <div><p className="text-xs text-sky-100/65">Nilai RAB terhitung</p><p className="data-type mt-2 text-2xl font-bold sm:text-3xl">{hasPriceData ? formatRupiah(totalRAB) : 'Harga belum tersedia'}</p></div>
          <div>
            <label htmlFor="budget-target" className="mb-2 block text-xs font-bold text-sky-100">Target nilai akhir RAB</label>
            <div className="flex items-center rounded-xl bg-white px-4 text-[var(--ink)]"><span className="data-type text-sm text-[var(--muted)]">Rp</span><input id="budget-target" inputMode="numeric" value={budgetInput} onChange={(e) => handleInput(e.target.value)} placeholder="250.000.000" className="w-full bg-transparent px-3 py-3.5 data-type text-base font-bold outline-none" /></div>
          </div>
        </div>
      </div>

      {!hasPriceData && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">Harga satuan tidak ditemukan. Sesi peninjauan volume tetap dapat dilakukan, tetapi estimasi Rupiah tidak tersedia. Isi target dengan angka apa pun untuk melanjutkan.</div>}
      {targetTooHigh && <div role="status" className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">Target akhir berada di atas nilai RAB saat ini, jadi tidak ada penghematan minimum yang perlu dikejar.</div>}
      {hasPriceData && desiredBudget > 0 && !targetTooHigh && <div className="mt-4 flex items-center justify-between rounded-xl border border-orange-200 bg-[var(--orange-soft)] px-4 py-4"><span className="text-sm text-orange-900">Penghematan yang perlu ditemukan</span><strong className="data-type text-lg text-orange-900">{formatRupiah(savingsTarget)}</strong></div>}

      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:justify-between">
        <button onClick={onBack} className="secondary-button">Kembali ke dokumen</button>
        <button onClick={() => onContinue(savingsTarget)} disabled={!canContinue} className="primary-button">Mulai tinjau volume</button>
      </div>
    </div>
  );
}
