export type ItemStatus = 'flexible' | 'locked';

export interface RABItem {
  id: string;
  kategori: string;
  kategoriRoman: string | null;
  no: number | null;
  uraian: string;
  satuan: string;
  volume: number;
  hargaMaterial: number | null;
  hargaUpah: number | null;
  status: ItemStatus;
  alasan: string | null;
}

export interface RABQuestion {
  itemId: string;
  question: string;
  type: 'verifikasi' | 'eksplorasi';
}

export interface AdjustedItem extends RABItem {
  volumeBaru?: number;
  jawabanUser?: string;
}

export interface RecommendationItem {
  itemId: string;
  uraian: string;
  volumeAwal: number;
  volumeUsulan: number | null;
  estimasiPenghematan: number | null;
  catatan: string;
}

export interface ParsedRAB {
  items: RABItem[];
  meta: {
    totalItems: number;
    flexibleCount: number;
    lockedCount: number;
  };
}

