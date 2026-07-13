'use client';

import { useState } from 'react';
import BudgetStep from '@/components/BudgetStep';
import OptimizeStep from '@/components/OptimizeStep';
import ResultStep from '@/components/ResultStep';
import UploadStep from '@/components/UploadStep';
import { ParsedRAB } from '@/lib/types/rab';

type Step = 'upload' | 'budget' | 'optimasi' | 'hasil';

interface AdjustedItemInput {
  itemId: string;
  uraian: string;
  volumeAwal: number;
  volumeBaru: number;
  jawabanUser?: string;
  hargaMaterial: number | null;
  hargaUpah: number | null;
}

const STEPS: { id: Step; label: string; shortLabel: string }[] = [
  { id: 'upload', label: 'Buka dokumen', shortLabel: 'Dokumen' },
  { id: 'budget', label: 'Tetapkan target', shortLabel: 'Target' },
  { id: 'optimasi', label: 'Tinjau volume', shortLabel: 'Tinjau' },
  { id: 'hasil', label: 'Susun rekomendasi', shortLabel: 'Hasil' },
];

export default function Home() {
  const [step, setStep] = useState<Step>('upload');
  const [parsed, setParsed] = useState<ParsedRAB | null>(null);
  const [savingsTarget, setSavingsTarget] = useState(0);
  const [adjustedItems, setAdjustedItems] = useState<AdjustedItemInput[]>([]);
  const activeIndex = STEPS.findIndex((item) => item.id === step);

  function handleRestart() {
    setParsed(null);
    setSavingsTarget(0);
    setAdjustedItems([]);
    setStep('upload');
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      {/* Grid Layout dipasang inline style agar aman di Tailwind v4 */}
      <div 
        className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-2 lg:gap-7"
        style={{ gridTemplateColumns: '300px minmax(0, 1fr)' }}
      >
        {/* Background dipasang inline style untuk menimpa warna putih dari class .panel */}
        <aside 
          className="panel relative overflow-hidden p-5 text-white lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:p-7"
          style={{ backgroundColor: 'var(--blueprint)' }}
        >
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/15" />
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/15" />
          <div className="relative flex h-full flex-col">
            <div>
              <div className="mb-8 flex items-center gap-3 lg:mb-14">
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-white/25 bg-white/10 data-type text-sm font-bold">
                  R/O
                </div>
                <div>
                  <p className="text-sm font-bold">RAB Optimizer</p>
                  <p className="text-[11px] text-slate-300">Quantity survey workspace</p>
                </div>
              </div>

              <p className="data-type mb-3 text-[10px] uppercase tracking-[0.2em] text-sky-200/70">Lembar kerja / 01</p>
              <h1 className="display-type max-w-xs text-3xl leading-[1.05] sm:text-4xl lg:text-[2.65rem]">
                Pangkas biaya tanpa menebak volume.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-200">
                Baca RAB, tandai ruang efisiensi, lalu dokumentasikan alasan setiap perubahan.
              </p>
            </div>

            <ol className="mt-8 grid grid-cols-4 gap-2 lg:mt-auto lg:grid-cols-1 lg:gap-0" aria-label="Tahapan optimasi RAB">
              {STEPS.map((item, index) => {
                const isActive = index === activeIndex;
                const isDone = index < activeIndex;
                return (
                  <li key={item.id} className="relative lg:pb-7 last:lg:pb-0">
                    {index < STEPS.length - 1 && (
                      <span className={`absolute left-4 top-8 hidden h-[calc(100%-2rem)] w-px lg:block ${isDone ? 'bg-orange-300' : 'bg-white/15'}`} />
                    )}
                    <div className="relative flex flex-col items-center gap-2 text-center lg:flex-row lg:text-left">
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border data-type text-[11px] font-bold ${isActive ? 'border-orange-300 bg-[var(--orange)] text-white' : isDone ? 'border-orange-200 bg-orange-100 text-orange-800' : 'border-white/25 bg-white/5 text-white/50'}`}>
                        {isDone ? 'OK' : String(index + 1).padStart(2, '0')}
                      </span>
                      <span className={isActive ? 'text-xs font-bold text-white lg:text-sm' : 'text-xs text-white/50 lg:text-sm'}>
                        <span className="lg:hidden">{item.shortLabel}</span>
                        <span className="hidden lg:inline">{item.label}</span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        <section className="panel min-h-[70vh] overflow-hidden p-5 sm:p-8 lg:min-h-[calc(100vh-4rem)] lg:p-10 xl:p-14">
          <div className="enter-stage mx-auto max-w-4xl" key={step}>
            {step === 'upload' && (
              <UploadStep onParsed={(result) => { setParsed(result); setStep('budget'); }} />
            )}
            {step === 'budget' && parsed && (
              <BudgetStep parsed={parsed} onBack={() => setStep('upload')} onContinue={(target) => { setSavingsTarget(target); setStep('optimasi'); }} />
            )}
            {step === 'optimasi' && parsed && (
              <OptimizeStep parsed={parsed} budgetTarget={savingsTarget} onBack={() => setStep('budget')} onFinish={(items) => { setAdjustedItems(items); setStep('hasil'); }} />
            )}
            {step === 'hasil' && (
              <ResultStep adjustedItems={adjustedItems} budgetTarget={savingsTarget} onBack={() => setStep('optimasi')} onRestart={handleRestart} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}