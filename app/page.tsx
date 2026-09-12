'use client';
import Link from 'next/link';

export default function Home() {
  const menus = [
    { title: 'Matrix', desc: 'ระบบบวกลบ คูณ และหาค่าอินเวอร์ส ทรานสโพส', link: '/matrix', color: 'from-blue-600 to-blue-800' },
    { title: 'Logic', desc: 'การประมวลผลประพจน์ ตารางค่าความจริง', link: '/logic', color: 'from-indigo-600 to-indigo-800' },
    { title: 'Number System', desc: 'เครื่องมือแปลงและคำนวณเลขฐาน 2, 8, 10, 16', link: '/converter', color: 'from-emerald-600 to-emerald-800' },
    { title: 'Boolean', desc: 'พีชคณิตบูลีน และลอจิกเกตพื้นฐาน', link: '/boolean', color: 'from-purple-600 to-purple-800' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
      <div className="w-full max-w-4xl flex flex-col items-center text-center mb-16 transition-all duration-700 ease-out translate-y-0 opacity-100">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4">
          คณิตศาสตร์คอมพิวเตอร์ CED
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
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${menu.color} rounded-full blur-[3rem] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
            <h2 className="text-3xl font-bold text-gray-100 mb-3 tracking-wide group-hover:text-white transition-colors z-10">
              {menu.title}
            </h2>
            <p className="text-gray-400 font-medium leading-relaxed group-hover:text-gray-300 transition-colors z-10">
              {menu.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}