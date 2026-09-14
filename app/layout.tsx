import './globals.css';
import { Analytics } from "@vercel/analytics/react"; // 1. นำเข้า Analytics
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  title: 'CED Math Tools',
  description: 'คณิตศาสตร์คอมพิวเตอร์ CED',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        {children}
        <SpeedInsights />
        <Analytics /> {/* 2. ใส่คอมโพเนนต์ Analytics ไว้ใน body */}
      </body>
    </html>
  );
}