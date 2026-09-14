'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function FeedbackApp() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [type, setType] = useState('');
  const [system, setSystem] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 🔴 นำ URL ของ Discord Webhook มาใส่ตรงนี้
    const WEBHOOK_URL = 'https://discord.com/api/webhooks/1548634060132188253/FglQoFnW_qZtcHHeyewTujIeSUuOcVNtN9qsSMp1j-5kfAX6hkCSJAckAf3wK2ciESVG';

    // จัดรูปแบบข้อความที่จะส่งเข้า Discord
    const payload = {
      content: `🚨 **มีฟีดแบ็กใหม่จาก CED Math Tools**\n\n📌 **ประเภท:** ${type}\n⚙️ **ระบบ:** ${system}\n📝 **หัวข้อ:** ${subject}\n💬 **รายละเอียด:**\n${description}`
    };

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setType('');
        setSystem('');
        setSubject('');
        setDescription('');
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col selection:bg-blue-500/30">
      <header className="w-full p-6 flex justify-start z-10 relative">
        <Link href="/" className="group flex items-center gap-3 text-sm md:text-base font-extrabold text-gray-400 hover:text-white transition-colors bg-gray-900/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 hover:border-white/20 shadow-sm">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          กลับหน้าหลัก
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="w-full max-w-2xl flex flex-col items-center text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            แจ้งปัญหา & ข้อเสนอแนะ
          </h1>
          <p className="text-gray-400 font-medium tracking-wide">
            ช่วยเราพัฒนา CED Math Tools ให้ดียิ่งขึ้น
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-gray-900/60 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-6 relative overflow-hidden hover:border-white/20 transition-colors">
          
          {isSuccess && (
            <div className="absolute inset-0 z-20 bg-gray-900/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
               <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/50">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">ส่งข้อมูลสำเร็จ!</h3>
               <p className="text-gray-400">ขอบคุณสำหรับข้อเสนอแนะของคุณ</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">ประเภทการแจ้ง</label>
              <select required value={type} onChange={(e) => setType(e.target.value)} className="w-full p-4 bg-gray-950/50 border border-white/10 rounded-xl text-white outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none">
                <option value="" disabled hidden>-- เลือกประเภท --</option>
                <option value="แจ้งปัญหาการใช้งาน (Bug)" className="bg-gray-900">🐞 แจ้งปัญหาการใช้งาน (Bug)</option>
                <option value="เสนอแนะฟีเจอร์ใหม่" className="bg-gray-900">💡 เสนอแนะฟีเจอร์ใหม่</option>
                <option value="อื่นๆ" className="bg-gray-900">💬 อื่นๆ</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">ระบบที่เกี่ยวข้อง</label>
              <select required value={system} onChange={(e) => setSystem(e.target.value)} className="w-full p-4 bg-gray-950/50 border border-white/10 rounded-xl text-white outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none">
                <option value="" disabled hidden>-- เลือกระบบ --</option>
                <option value="Matrix" className="bg-gray-900">Matrix</option>
                <option value="Logic" className="bg-gray-900">Logic</option>
                <option value="Number System" className="bg-gray-900">Number System</option>
                <option value="Boolean" className="bg-gray-900">Boolean</option>
                <option value="ภาพรวมทั้งหมด" className="bg-gray-900">ภาพรวมทั้งหมด</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">หัวข้อ</label>
            <input required type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="สรุปเรื่องที่ต้องการแจ้งสั้นๆ..." className="w-full p-4 bg-gray-950/50 border border-white/10 rounded-xl text-white outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">รายละเอียด</label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="อธิบายปัญหาที่พบ หรือสิ่งที่อยากให้เพิ่ม..." className="w-full p-4 bg-gray-950/50 border border-white/10 rounded-xl text-white outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600 resize-none custom-scrollbar"></textarea>
          </div>

          <div className="flex flex-col gap-2 border-t border-white/10 pt-6">
             <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-white text-black font-extrabold rounded-xl hover:bg-gray-200 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 tracking-wide">
               {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    กำลังส่งข้อมูล...
                  </>
               ) : (
                  'ส่งข้อมูล'
               )}
             </button>
          </div>
        </form>
      </main>
    </div>
  );
}