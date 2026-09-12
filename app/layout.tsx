import './globals.css';
import { Analytics } from "@vercel/analytics/react"; // 1. นำเข้า Analytics
import { SpeedInsights } from '@vercel/speed-insights/next'; // 2. นำเข้า Speed Insights

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
        <Analytics /> {/* 2. ใส่คอมโพเนนต์ Analytics ไว้ใน body */}
        <SpeedInsights /> {/* 3. ใส่คอมโพเนนต์ Speed Insights ไว้ใน body */}
      </body>
    </html>
  );
}