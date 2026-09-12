import './globals.css';
import { Analytics } from "@vercel/analytics/next"; // 1. นำเข้า Analytics

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
      </body>
    </html>
  );
}