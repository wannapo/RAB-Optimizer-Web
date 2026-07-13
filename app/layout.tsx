import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RAB Optimizer | Ruang kerja efisiensi proyek',
  description: 'Analisis volume pekerjaan dan susun rekomendasi efisiensi RAB dengan alur kerja yang terukur.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
