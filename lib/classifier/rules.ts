import { ItemStatus } from '../types/rab';

interface CategoryRule {
  status: ItemStatus | 'partial';
  reason: string | null;
}

export const CATEGORY_RULES: Record<string, CategoryRule> = {
  'PEKERJAAN PERSIAPAN': { status: 'flexible', reason: null },
  'PEKERJAAN BOBOKAN / BONGKARAN': { status: 'flexible', reason: null },
  'PEKERJAAN TANAH': { status: 'flexible', reason: null },
  'PEKERJAAN PONDASI & BETON': { status: 'locked', reason: 'Struktural — pondasi & beton tidak dapat diubah' },
  'PEKERJAAN PASANGAN': { status: 'flexible', reason: null },
  'PEKERJAAN BESI': { status: 'locked', reason: 'Pekerjaan besi tidak dapat diubah' },
  'PEKERJAAN KERAMIK': { status: 'locked', reason: 'Pekerjaan keramik tidak dapat diubah' },
  'PEKERJAAN PLUMBING': { status: 'flexible', reason: null },
  'PEKERJAAN SANITARY': { status: 'locked', reason: 'Pekerjaan sanitary tidak dapat diubah' },
  'PEKERJAAN ATAP': { status: 'partial', reason: 'Hanya bagian flashing yang dapat disesuaikan' },
  'PEKERJAAN KUSEN, PINTU & KACA': { status: 'locked', reason: 'Kusen, pintu & kaca tidak dapat diubah' },
  'PEKERJAAN FINISHING': { status: 'flexible', reason: 'Sangat fleksibel — volume dapat disesuaikan meski ada merk' },
};

export const PARTIAL_EXCEPTIONS: Record<string, { flexibleKeywords: string[]; lockedReason: string }> = {
  'PEKERJAAN ATAP': {
    flexibleKeywords: ['flashing'],
    lockedReason: 'Struktural atap — hanya flashing yang dapat disesuaikan',
  },
};

export function normalizeCategoryName(name: string): string {
  return (name || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');
}

export function classifyItem(categoryName: string, uraian: string): { status: ItemStatus; reason: string | null } {
  const normCat = normalizeCategoryName(categoryName);
  const rule = CATEGORY_RULES[normCat];

  if (!rule) {
    return { status: 'flexible', reason: 'Kategori tidak dikenali — default fleksibel' };
  }

  if (rule.status === 'partial') {
    const exception = PARTIAL_EXCEPTIONS[normCat];
    const uraianLower = (uraian || '').toLowerCase();
    const isFlexible = exception.flexibleKeywords.some((kw) => uraianLower.includes(kw));
    if (isFlexible) {
      return { status: 'flexible', reason: 'Item flashing — dapat disesuaikan' };
    }
    return { status: 'locked', reason: exception.lockedReason };
  }

  return { status: rule.status as ItemStatus, reason: rule.reason };
}
