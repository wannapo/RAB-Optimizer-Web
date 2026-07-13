export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    value
  );
}

export function hargaSatuan(hargaMaterial: number | null, hargaUpah: number | null): number {
  return (hargaMaterial ?? 0) + (hargaUpah ?? 0);
}
