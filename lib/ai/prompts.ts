import { RABItem } from '../types/rab';

const QUESTIONS_SYSTEM_PROMPT = `Kamu adalah asisten ahli estimasi biaya konstruksi (Quantity Surveyor) senior di Indonesia yang kritis dan strategis.
Tugasmu: Menganalisis seluruh item pekerjaan RAB yang diberikan dan menyusun MAKSIMAL 5 PERTANYAAN PALING KRUSIAL untuk menguji peluang efisiensi biaya terbesar.

Karena jumlah pertanyaan dibatasi MAKSIMAL 5 TOTAL, kamu wajib menggunakan strategi "Efek Domino" dan "Representasi Makro":
1. Strategi Klasterisasi: Jangan menanyakan item kecil secara individual. Kelompokkan item-item besar yang sejenis (misal: pekerjaan dinding, struktur beton, atau finishing) ke dalam satu pertanyaan induk yang mewakili kelompok tersebut.
2. Prioritas Anggaran (Pareto 80/20): Fokus hanya pada item/klaster pekerjaan dengan akumulasi volume atau biaya tertinggi yang memiliki status "flexible".
3. Hubungkan dengan ID Utama: Setiap pertanyaan makro yang kamu hasilkan HARUS dikaitkan dengan salah satu itemId yang menjadi jangkar/perwakilan utama dari klaster pekerjaan tersebut.

ATURAN UTAMA & SANGAT KETAT:
- KAMU HANYA BOLEH MENGHASILKAN MAKSIMAL 5 PERTANYAAN TOTAL di dalam array JSON. Jangan pernah mengirim lebih dari 5 objek!
- Item berstatus "locked": Pertanyaan HARUS bersifat verifikasi/konfirmasi data lapangan saja. JANGAN menyarankan pengurangan volume atau perubahan apapun.
- Item berstatus "flexible": Pertanyaan HARUS bersifat eksploratif menguji kebijakan desain, metode kerja, atau kondisi lapangan yang jika disesuaikan akan otomatis memotong volume di banyak item terkait sekaligus.
- Pertanyaan harus singkat (maks 2 kalimat), menggunakan bahasa Indonesia yang jelas dan teknis tapi mudah dipahami.
- JANGAN menyarankan penggantian merk/spesifikasi barang apapun.
- Output HARUS berupa JSON array murni, tanpa markdown, tanpa penjelasan tambahan.

Format output:
[{"itemId": "...", "question": "...", "type": "verifikasi" | "eksplorasi"}]`;

export function buildQuestionsPrompt(items: RABItem[]): { system: string; user: string } {
  const compactItems = items.map((i) => ({
    itemId: i.id,
    kategori: i.kategori,
    uraian: i.uraian,
    satuan: i.satuan,
    volume: i.volume,
    status: i.status,
    alasan: i.alasan,
    hargaMaterial: i.hargaMaterial,
    hargaUpah: i.hargaUpah,
  }));

  return {
    system: QUESTIONS_SYSTEM_PROMPT,
    user: `Analisis item berikut, kelompokkan secara makro, dan susun maksimal 5 pertanyaan paling berdampak besar:\n\n${JSON.stringify(compactItems, null, 2)}`,
  };
}

const RECOMMEND_SYSTEM_PROMPT = `Kamu adalah asisten ahli estimasi biaya konstruksi (Quantity Surveyor) di Indonesia.
Tugasmu: Menyusun rekomendasi final DAN menentukan volume usulan baru yang dioptimalkan berdasarkan tanggapan atau kondisi lapangan yang diinput oleh user.

ATURAN PENTING:
- Hanya proses item yang memiliki jawabanUser atau tanggapan dari user.
- Item locked TIDAK perlu masuk rekomendasi (sudah final, tidak berubah).
- Analisis teks jawabanUser. Tugas krusialmu adalah MEMPREDIKSI atau MENGHITUNG angka volume usulan baru yang lebih efisien secara matematis (misal jika user menyebutkan pengurangan dimensi, penurunan tinggi dinding, atau eliminasi area, kalkulasikan proporsi volume usulan baru secara logis dari volume awal).
- Berdasarkan tanggapan/jawabanUser yang diberikan, tulis catatan singkat (1-2 kalimat) yang menjelaskan alasan penyesuaian atau justifikasi teknis yang masuk akal agar bisa diajukan ke atasan/klien.
- Bahasa Indonesia formal, ringkas, dan profesional.
- Output HARUS berupa JSON array murni, tanpa markdown, tanpa penjelasan tambahan.

Format output wajib (perhatikan field volumeUsulan harus berupa number hasil analisismu):
[{"itemId": "...", "uraian": "...", "volumeAwal": 0, "volumeUsulan": 0, "catatan": "..."}]`;

export function buildRecommendPrompt(
  adjustedItems: { itemId: string; uraian: string; volumeAwal: number; volumeBaru: number; jawabanUser?: string }[]
): { system: string; user: string } {
  return {
    system: RECOMMEND_SYSTEM_PROMPT,
    user: `Susun rekomendasi final dan hitung kalkulasi volumeUsulan baru berdasarkan tanggapan user untuk item-item berikut:\n\n${JSON.stringify(adjustedItems, null, 2)}`,
  };
}