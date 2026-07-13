import { NextRequest, NextResponse } from 'next/server';
import { parseRABFromBuffer } from '@/lib/parser/xlsx-parser';

// Wajib pake Node.js runtime (bukan Edge), karena library xlsx butuh Buffer/fs API
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'File tidak ditemukan pada request.' }, { status: 400 });
    }

    const allowedExtensions = ['.xls', '.xlsx'];
    const isAllowed = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan file .xls atau .xlsx.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = parseRABFromBuffer(buffer);

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat parsing file.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
