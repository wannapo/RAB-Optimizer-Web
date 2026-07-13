import * as XLSX from 'xlsx';
import { nanoid } from 'nanoid';
import { classifyItem } from '../classifier/rules';
import { RABItem, ParsedRAB } from '../types/rab';

const ROMAN_REGEX = /^(I{1,3}|IV|VI{0,3}|IX|X{1,2}|XI{1,3}|XII)\s*$/;

function isRomanNumeral(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  return ROMAN_REGEX.test(val.trim());
}

function isNumber(val: unknown): val is number {
  return typeof val === 'number' && !isNaN(val);
}

/**
 * Cari nama sheet yang paling cocok buat sheet RAB detail.
 * Prioritas: exact match "RAB_Sipil", fallback: sheet yang namanya mengandung "RAB" (bukan "Rekap")
 */
function resolveSheetName(sheetNames: string[], preferred = 'RAB_Sipil'): string {
  if (sheetNames.includes(preferred)) return preferred;

  const candidate = sheetNames.find(
    (name) => name.toLowerCase().includes('rab') && !name.toLowerCase().includes('rekap')
  );
  if (candidate) return candidate;

  throw new Error(
    `Sheet "${preferred}" tidak ditemukan, dan tidak ada sheet lain yang cocok. Sheet tersedia: ${sheetNames.join(', ')}`
  );
}

/**
 * Parse file RAB (xls/xlsx) dari Buffer menjadi struktur data JSON.
 */
export function parseRABFromBuffer(buffer: Buffer, preferredSheet = 'RAB_Sipil'): ParsedRAB {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = resolveSheetName(workbook.SheetNames, preferredSheet);
  const sheet = workbook.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });

  const items: RABItem[] = [];
  let currentCategory: string | null = null;
  let currentCategoryRoman: string | null = null;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const col0 = row[0];
    const col1 = (row[1] ?? '').toString().trim();

    // Deteksi baris kategori: kolom A angka romawi + kolom B ada teks nama kategori
    if (isRomanNumeral(col0) && col1) {
      currentCategoryRoman = col0.toString().trim();
      currentCategory = col1;
      continue;
    }

    // Skip baris sub-total / kosong / header
    if (!col1 || col1.toLowerCase().includes('sub-total') || col1.toLowerCase().includes('subtotal')) {
      continue;
    }
    if (!currentCategory) continue;

    const isStandardItem = isNumber(col0) && !!col1;
    const isSubItemShifted = col0 === '' && col1.startsWith('-');

    let satuan: unknown;
    let volume: unknown;

    if (isStandardItem) {
      satuan = row[2];
      volume = row[3];
    } else if (isSubItemShifted) {
      // quirk: data volume/satuan di beberapa RAB tergeser ke kolom lain (misal kategori Bobokan)
      const shiftedVolume = row[14];
      const shiftedSatuan = row[15];
      if (isNumber(shiftedVolume)) {
        satuan = shiftedSatuan;
        volume = shiftedVolume;
      } else {
        continue;
      }
    } else {
      continue;
    }

    if (!isNumber(volume)) continue;

    const uraian = col1.replace(/^-\s*/, '').trim();
    const classification = classifyItem(currentCategory, uraian);

    items.push({
      id: nanoid(8),
      kategori: currentCategory,
      kategoriRoman: currentCategoryRoman,
      no: isStandardItem ? Number(col0) : null,
      uraian,
      satuan: (satuan ?? '').toString().trim(),
      volume: volume as number,
      hargaMaterial: isNumber(row[4]) ? (row[4] as number) : null,
      hargaUpah: isNumber(row[5]) ? (row[5] as number) : null,
      status: classification.status,
      alasan: classification.reason,
    });
  }

  const flexibleCount = items.filter((i) => i.status === 'flexible').length;

  return {
    items,
    meta: {
      totalItems: items.length,
      flexibleCount,
      lockedCount: items.length - flexibleCount,
    },
  };
}
