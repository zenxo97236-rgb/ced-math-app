'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react'; // 👈 1. เพิ่ม import นี้

export default function Home() {
  // 👈 2. เพิ่ม State และ useEffect ควบคุมเวลาหน้าจอโหลด
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // โลโก้ใช้วาด 2.5 วิ + ถมสี 1 วิ = 3.5 วินาที พอดีเป๊ะค่อยเฟดออก
    const fadeTimer = setTimeout(() => setFadeOut(true), 3500); 
    const removeTimer = setTimeout(() => setShowSplash(false), 4500); 
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  const menus = [
    { title: 'Matrix', desc: 'ระบบบวกลบ คูณ และหาค่าอินเวอร์ส ทรานสโพส', link: '/matrix', color: 'from-blue-600 to-blue-800' },
    { title: 'Logic', desc: 'การประมวลผลประพจน์ ตารางค่าความจริง', link: '/logic', color: 'from-indigo-600 to-indigo-800' },
    { title: 'Number System', desc: 'เครื่องมือแปลงและคำนวณเลขฐาน 2, 8, 10, 16', link: '/converter', color: 'from-emerald-600 to-emerald-800' },
    { title: 'Boolean', desc: 'พีชคณิตบูลีน และลอจิกเกตพื้นฐาน', link: '/boolean', color: 'from-purple-600 to-purple-800' },
  ];

  return (
    // 👈 3. เพิ่ม relative ต่อท้าย class นี้
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col selection:bg-blue-500/30 relative">
      
      {/* 👈 4. เพิ่มบล็อกหน้าจอเปิดตัว (Splash Screen) ตรงนี้ */}
      {showSplash && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-950 transition-opacity duration-1000 ease-in-out ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
          <img 
            src="/animated-logo.svg" 
            alt="CMT Logo" 
            className="w-40 h-40 md:w-56 md:h-56 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          />
        </div>
      )}

      {/* ส่วนเนื้อหาหลัก (Main Content) */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full">
        <div className="w-full max-w-4xl flex flex-col items-center text-center mb-16 transition-all duration-700 ease-out translate-y-0 opacity-100">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-white to-gray-400 mb-4">
            CED Math Tools
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl font-medium tracking-wide">
            เลือกเครื่องมือที่คุณต้องการใช้งาน
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {menus.map((menu, idx) => (
            <Link 
              key={idx} 
              href={menu.link} 
              className="group relative flex flex-col items-start p-8 bg-gray-900 rounded-3xl border border-gray-800 hover:border-gray-600 hover:-translate-y-2 hover:shadow-2xl active:scale-95 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${menu.color} rounded-full blur-[3rem] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
              <h2 className="text-3xl font-bold text-gray-100 mb-3 tracking-wide group-hover:text-white transition-colors z-10">
                {menu.title}
              </h2>
              <p className="text-gray-400 font-medium leading-relaxed group-hover:text-gray-300 transition-colors z-10">
                {menu.desc}
              </p>
            </Link>
          ))}
        </div>
      </main>

      {/* ส่วนท้าย (Footer) */}
      <footer className="w-full py-6 px-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 border-t border-white/5 mt-auto">
        <p className="font-medium tracking-wide text-center md:text-left">
          CED Math Tools Version 1.0
        </p>
        
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 mt-4 md:mt-0">
          <Link 
            href="/feedback" 
            className="hover:text-gray-300 transition-colors underline underline-offset-4"
          >
            แจ้งปัญหา / ข้อเสนอแนะ
          </Link>
          
          <span className="hidden md:inline text-gray-700">|</span>
          
          <Link 
            href="https://forms.gle/PsibGsCXb4kFBAp2A" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-400/80 hover:text-indigo-300 transition-colors underline underline-offset-4 font-bold flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            แบบประเมินความพึงพอใจ
          </Link>
        </div>
      </footer>

    </div>
  );
}