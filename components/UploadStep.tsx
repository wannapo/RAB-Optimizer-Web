'use client';

import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { ParsedRAB } from '@/lib/types/rab';

interface Props { onParsed: (result: ParsedRAB) => void; }

const MAX_FILE_SIZE = 15 * 1024 * 1024;

export default function UploadStep({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectFile(nextFile: File | null) {
    setError(null);
    if (!nextFile) return setFile(null);
    if (!/\.xlsx?$/i.test(nextFile.name)) return setError('Pilih dokumen Excel dengan format .xls atau .xlsx.');
    if (nextFile.size > MAX_FILE_SIZE) return setError('Ukuran dokumen melebihi 15 MB. Kurangi ukuran file lalu coba lagi.');
    setFile(nextFile);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0] ?? null);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] ?? null);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dokumen gagal dibaca.');
      onParsed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dokumen gagal dibaca. Coba periksa formatnya.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="eyebrow">Tahap 01 · Dokumen sumber</p>
      <h2 className="display-type mt-3 max-w-2xl text-4xl leading-tight text-[var(--blueprint)] sm:text-5xl">
        Mulai dari lembar RAB yang sedang dikerjakan.
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
        Sistem membaca uraian, volume, satuan, serta harga material dan upah. File asli tidak akan diubah.
      </p>

      <div
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`mt-8 rounded-2xl border-2 border-dashed p-6 transition sm:p-10 ${dragging ? 'border-[var(--orange)] bg-[var(--orange-soft)]' : file ? 'border-[var(--blueprint-bright)] bg-sky-50/70' : 'border-[#a9bec7] bg-[#f7fafb]'}`}
      >
        <input ref={inputRef} type="file" accept=".xls,.xlsx" onChange={handleChange} className="sr-only" />
        <div className="flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--blueprint)] text-white shadow-[0_5px_0_#082f45]" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 2.75h7l4 4V21H7z"/><path d="M14 2.75V7h4M9.5 12h6M9.5 15.5h6"/></svg>
          </div>
          {file ? (
            <>
              <p className="mt-5 font-bold text-[var(--ink)]">{file.name}</p>
              <p className="data-type mt-1 text-xs text-[var(--muted)]">{(file.size / 1024).toFixed(0)} KB · siap dianalisis</p>
              <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 text-sm font-bold text-[var(--blueprint-bright)] underline underline-offset-4">Ganti dokumen</button>
            </>
          ) : (
            <>
              <p className="mt-5 font-bold text-[var(--ink)]">Tarik file Excel ke area ini</p>
              <p className="mt-1 text-sm text-[var(--muted)]">atau pilih langsung dari perangkat</p>
              <button type="button" onClick={() => inputRef.current?.click()} className="secondary-button mt-5">Pilih dokumen</button>
            </>
          )}
        </div>
      </div>

      {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--red)]">{error}</div>}

      <div className="mt-5 flex flex-col gap-4 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-5 text-xs text-[var(--muted)]">
          <span><b className="text-[var(--ink)]">Format</b><br />XLS / XLSX</span>
          <span><b className="text-[var(--ink)]">Batas</b><br />15 MB</span>
          <span><b className="text-[var(--ink)]">Proses</b><br />File tidak diubah</span>
        </div>
        <button onClick={handleUpload} disabled={!file || loading} className="primary-button min-w-44">
          {loading ? 'Membaca lembar RAB…' : 'Baca dan petakan RAB'}
        </button>
      </div>
    </div>
  );
}
