'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// --- Types ---
type BaseOption = 2 | 8 | 10 | 16;
type OperatorOption = '+' | '-' | '*' | '/';

// --- Utility Functions ---
const isValidForBase = (val: string, base: BaseOption) => {
  if (!val) return true;
  const regexes = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^-?[0-9]+$/,
    16: /^-?[0-9a-fA-F]+$/
  };
  return regexes[base].test(val);
};

const formatDigit = (d: number) => d >= 10 ? String.fromCharCode(55 + d) : d.toString();

export default function NumberSystemApp() {
  const [activeTab, setActiveTab] = useState<'convert' | 'calc'>('convert');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Conversion State
  const [convVal, setConvVal] = useState('');
  const [convFrom, setConvFrom] = useState<BaseOption>(10);
  const [convTo, setConvTo] = useState<BaseOption>(2);
  const [showConvSteps, setShowConvSteps] = useState(false);

  // Calculation State
  const [calcA, setCalcA] = useState('');
  const [calcBaseA, setCalcBaseA] = useState<BaseOption>(10);
  const [calcOp, setCalcOp] = useState<OperatorOption>('+');
  const [calcB, setCalcB] = useState('');
  const [calcBaseB, setCalcBaseB] = useState<BaseOption>(10);
  const [calcBaseOut, setCalcBaseOut] = useState<BaseOption>(10);
  const [showCalcSteps, setShowCalcSteps] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'convert' || tab === 'calc') {
        setTimeout(() => setActiveTab(tab as 'convert' | 'calc'), 0);
      }
    }
  }, []);

  const handleTabChange = (tab: 'convert' | 'calc') => {
    if (activeTab === tab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
      if (typeof window !== 'undefined') window.history.replaceState(null, '', `?tab=${tab}`);
    }, 300);
    setIsMobileMenuOpen(false);
  };

  // --- Core Conversion Logic ---
  const isConvValid = isValidForBase(convVal, convFrom);
  const convDecVal = isConvValid && convVal ? parseInt(convVal, convFrom) : NaN;
  const convResult = !isNaN(convDecVal) ? convDecVal.toString(convTo).toUpperCase() : '';

  const generateConvSteps = () => {
    if (!isConvValid || !convVal) return null;
    const steps: React.ReactNode[] = [];
    const currentDec = convDecVal;

    if (convFrom !== 10) {
      steps.push(<div key="s1" className="font-bold text-blue-400 mb-2">1. แปลงจากฐาน {convFrom} เป็นฐาน 10</div>);
      const chars = convVal.toUpperCase().split('');
      const len = chars.length;
      const polys = chars.map((c, i) => `${parseInt(c, convFrom)} × ${convFrom}<sup>${len - 1 - i}</sup>`);
      const values = chars.map((c, i) => parseInt(c, convFrom) * Math.pow(convFrom, len - 1 - i));
      
      steps.push(
        <div key="s1-math" className="ml-4 mb-4 text-gray-300 font-mono text-sm leading-relaxed">
          <div>= <span dangerouslySetInnerHTML={{ __html: polys.join(' + ') }} /></div>
          <div>= {values.join(' + ')}</div>
          <div className="font-bold text-white">= {currentDec}<sub>10</sub></div>
        </div>
      );
    }

    if (convTo !== 10) {
       steps.push(<div key="s2" className="font-bold text-emerald-400 mb-2">{convFrom !== 10 ? '2.' : '1.'} แปลงค่า {currentDec}<sub>10</sub> เป็นฐาน {convTo}</div>);
       if (currentDec === 0) {
         steps.push(<div key="s2-zero" className="ml-4 text-gray-300 font-mono">ผลลัพธ์คือ 0</div>);
       } else {
         let temp = Math.abs(currentDec);
         const divSteps = [];
         const rems = [];
         while (temp > 0) {
            const rem = temp % convTo;
            const next = Math.floor(temp / convTo);
            divSteps.push(<div key={`div-${temp}`}>{temp} ÷ {convTo} = {next} เศษ <strong className="text-white">{formatDigit(rem)}</strong></div>);
            rems.push(formatDigit(rem));
            temp = next;
         }
         steps.push(
            <div key="s2-math" className="ml-4 mb-4 text-gray-300 font-mono text-sm leading-relaxed">
              {divSteps}
              <div className="mt-2 text-emerald-300">นำเศษมาเรียงจากล่างขึ้นบน จะได้: {rems.reverse().join('')}<sub>{convTo}</sub></div>
            </div>
         );
       }
    }
    
    if (convFrom === 10 && convTo === 10) {
       steps.push(<div key="s-same" className="text-gray-400">ฐานเดียวกัน ไม่จำเป็นต้องแปลงค่า</div>);
    }
    return steps;
  };

  // --- Core Calc Logic ---
  const isAValid = isValidForBase(calcA, calcBaseA);
  const isBValid = isValidForBase(calcB, calcBaseB);
  
  const valA = isAValid && calcA ? parseInt(calcA, calcBaseA) : NaN;
  const valB = isBValid && calcB ? parseInt(calcB, calcBaseB) : NaN;
  
  let calcDecResult = NaN;
  let errorMsg = '';

  if (!isNaN(valA) && !isNaN(valB)) {
     if (calcOp === '+') calcDecResult = valA + valB;
     else if (calcOp === '-') calcDecResult = valA - valB;
     else if (calcOp === '*') calcDecResult = valA * valB;
     else if (calcOp === '/') {
        if (valB === 0) errorMsg = 'หารด้วยศูนย์ไม่ได้';
        else calcDecResult = Math.floor(valA / valB);
     }
  }

  const calcFinalResult = !isNaN(calcDecResult) ? calcDecResult.toString(calcBaseOut).toUpperCase() : '';

  const generateCalcSteps = () => {
     if (isNaN(valA) || isNaN(valB)) return null;
     const steps: React.ReactNode[] = [];
     
     steps.push(<div key="c1" className="font-bold text-blue-400 mb-2">1. แปลงตัวตั้งและตัวหารเป็นฐาน 10</div>);
     steps.push(
        <div key="c1-math" className="ml-4 mb-4 text-gray-300 font-mono text-sm">
           <div>A: {calcA}<sub>{calcBaseA}</sub> = {valA}<sub>10</sub></div>
           <div>B: {calcB}<sub>{calcBaseB}</sub> = {valB}<sub>10</sub></div>
        </div>
     );

     steps.push(<div key="c2" className="font-bold text-pink-400 mb-2">2. ทำการคำนวณทางคณิตศาสตร์ (ฐาน 10)</div>);
     if (errorMsg) {
        steps.push(<div key="c2-err" className="ml-4 mb-4 text-red-400 font-bold">{errorMsg}</div>);
        return steps;
     }

     const opMap = { '+': 'บวก', '-': 'ลบ', '*': 'คูณ', '/': 'หาร (ปัดเศษทิ้ง)' };
     steps.push(
        <div key="c2-math" className="ml-4 mb-4 text-gray-300 font-mono text-sm">
           <div>นำ {valA} {opMap[calcOp]} {valB}</div>
           <div className="font-bold text-white">ผลลัพธ์ = {calcDecResult}<sub>10</sub></div>
        </div>
     );

     if (calcBaseOut !== 10) {
        steps.push(<div key="c3" className="font-bold text-emerald-400 mb-2">3. แปลงผลลัพธ์กลับเป็นฐานเป้าหมาย ({calcBaseOut})</div>);
        if (calcDecResult === 0) {
           steps.push(<div key="c3-zero" className="ml-4 text-gray-300 font-mono">ผลลัพธ์คือ 0</div>);
        } else {
           let temp = Math.abs(calcDecResult);
           const divSteps = [];
           const rems = [];
           while (temp > 0) {
              const rem = temp % calcBaseOut;
              const next = Math.floor(temp / calcBaseOut);
              divSteps.push(<div key={`c3-div-${temp}`}>{temp} ÷ {calcBaseOut} = {next} เศษ <strong className="text-white">{formatDigit(rem)}</strong></div>);
              rems.push(formatDigit(rem));
              temp = next;
           }
           const signStr = calcDecResult < 0 ? '-' : '';
           steps.push(
              <div key="c3-math" className="ml-4 mb-4 text-gray-300 font-mono text-sm leading-relaxed">
                {divSteps}
                <div className="mt-2 text-emerald-300">นำเศษมาเรียง จะได้: {signStr}{rems.reverse().join('')}<sub>{calcBaseOut}</sub></div>
              </div>
           );
        }
     }

     return steps;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30">
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #111827; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}} />

      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}></div>

      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-gray-900/80 backdrop-blur-xl border-r border-white/10 flex flex-col shrink-0 z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-5 flex items-center justify-between shrink-0 border-b border-white/10">
          <Link href="/" className="group flex items-center gap-3 text-lg font-extrabold text-white hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Home
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex flex-col p-4 gap-3 flex-1 overflow-y-auto custom-scrollbar mt-4">
          <Link href="/matrix" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">Matrix</Link>
          <Link href="/logic" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">Logic</Link>
          <Link href="/converter" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-emerald-600/90 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-500/50 transition-all">Number System</Link>
          <Link href="/boolean" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">Boolean</Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar relative">
        <div className="md:hidden flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
          <span className="font-extrabold text-white text-lg">ระบบเลขฐาน</span>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-400 hover:text-white">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        <div className="hidden md:block bg-gray-900/80 backdrop-blur-xl border-b border-white/10 pt-6 md:pt-10 px-4 md:px-10 sticky top-0 z-20 shadow-sm">
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-wide mb-6">ระบบเลขฐาน (Number System)</h1>
          <div className="flex gap-6 overflow-x-auto custom-scrollbar">
            <button onClick={() => handleTabChange('convert')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'convert' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>การแปลงเลขฐาน</button>
            <button onClick={() => handleTabChange('calc')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'calc' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>การคำนวณเลขฐาน</button>
          </div>
        </div>

        <div key={activeTab} className={`p-4 md:p-10 flex flex-col items-center w-full transition-all duration-300 ease-in-out transform ${isTransitioning ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>
          
          {activeTab === 'convert' && (
            <div className="w-full max-w-4xl flex flex-col gap-6">
               <div className="bg-gray-800/60 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-sm border border-white/10 w-full hover:border-white/20 transition-colors flex flex-col gap-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="flex flex-col gap-3">
                        <label className="text-gray-300 font-bold uppercase tracking-wide text-sm">เลขฐานเริ่มต้น (From)</label>
                        <select value={convFrom} onChange={(e) => setConvFrom(Number(e.target.value) as BaseOption)} className="p-3 bg-gray-900/80 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500 font-bold">
                           <option value={2}>ฐาน 2 (Binary)</option>
                           <option value={8}>ฐาน 8 (Octal)</option>
                           <option value={10}>ฐาน 10 (Decimal)</option>
                           <option value={16}>ฐาน 16 (Hexadecimal)</option>
                        </select>
                        <input type="text" value={convVal} onChange={(e) => setConvVal(e.target.value)} placeholder={`พิมพ์เลขฐาน ${convFrom} ที่นี่...`} className={`w-full p-4 border-2 bg-gray-900/80 text-white font-bold text-xl md:text-2xl uppercase rounded-xl outline-none transition-all shadow-inner ${!isConvValid && convVal ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-emerald-500'}`} />
                        {!isConvValid && convVal && <span className="text-red-400 text-xs font-bold">รูปแบบตัวเลขไม่ถูกต้องสำหรับฐาน {convFrom}</span>}
                     </div>

                     <div className="flex flex-col gap-3">
                        <label className="text-gray-300 font-bold uppercase tracking-wide text-sm">แปลงเป็นฐาน (To)</label>
                        <select value={convTo} onChange={(e) => setConvTo(Number(e.target.value) as BaseOption)} className="p-3 bg-gray-900/80 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500 font-bold">
                           <option value={2}>ฐาน 2 (Binary)</option>
                           <option value={8}>ฐาน 8 (Octal)</option>
                           <option value={10}>ฐาน 10 (Decimal)</option>
                           <option value={16}>ฐาน 16 (Hexadecimal)</option>
                        </select>
                        <div className="w-full p-4 border-2 border-transparent bg-emerald-900/20 text-emerald-300 font-bold text-xl md:text-2xl uppercase rounded-xl shadow-inner min-h-16 break-all">
                           {convResult || '-'}
                        </div>
                     </div>
                  </div>

                  {convVal && isConvValid && (
                     <div className="mt-4 border-t border-white/10 pt-6">
                        <button onClick={() => setShowConvSteps(!showConvSteps)} className="w-full py-3 px-4 bg-gray-900/80 hover:bg-gray-900 border border-white/10 rounded-xl text-gray-300 font-bold transition-colors flex items-center justify-center gap-2">
                           {showConvSteps ? 'ซ่อนวิธีทำ' : 'ดูวิธีทำแบบละเอียด'}
                           <span className={`transform transition-transform ${showConvSteps ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        
                        <div className={`transition-all duration-500 overflow-hidden ${showConvSteps ? 'max-h-250 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                           <div className="bg-gray-900/80 p-6 rounded-xl border border-white/5 text-base shadow-inner">
                              {generateConvSteps()}
                           </div>
                        </div>
                     </div>
                  )}

               </div>
            </div>
          )}

          {activeTab === 'calc' && (
            <div className="w-full max-w-4xl flex flex-col gap-6">
               <div className="bg-gray-800/60 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-sm border border-white/10 w-full hover:border-white/20 transition-colors flex flex-col gap-8">
                  
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                     <div className="flex-1 w-full flex flex-col gap-2">
                        <label className="text-gray-400 font-bold text-xs uppercase">ตัวตั้ง (A)</label>
                        <div className="flex gap-2">
                           <input type="text" value={calcA} onChange={(e) => setCalcA(e.target.value)} placeholder="0" className={`w-full p-3 border-2 bg-gray-900/80 text-white font-bold text-lg uppercase rounded-xl outline-none transition-all ${!isAValid && calcA ? 'border-red-500/50' : 'border-white/10 focus:border-blue-500'}`} />
                           <select value={calcBaseA} onChange={(e) => setCalcBaseA(Number(e.target.value) as BaseOption)} className="w-24 p-3 bg-gray-900/80 border border-white/10 rounded-xl text-gray-300 outline-none font-bold">
                              <option value={2}>ฐาน 2</option><option value={8}>ฐาน 8</option><option value={10}>ฐาน 10</option><option value={16}>ฐาน 16</option>
                           </select>
                        </div>
                     </div>

                     <div className="w-full md:w-auto flex justify-center pb-1">
                        <div className="flex gap-1.5 bg-gray-900/80 p-1.5 rounded-2xl border border-white/10 shadow-inner">
                           {(['+', '-', '*', '/'] as OperatorOption[]).map(op => (
                              <button key={op} type="button" onClick={() => setCalcOp(op)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${calcOp === op ? 'bg-blue-600/80 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)] border border-blue-500/50' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}>
                                 {op === '+' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>}
                                 {op === '-' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/></svg>}
                                 {op === '*' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>}
                                 {op === '/' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v.01M12 18v.01M5 12h14"/></svg>}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="flex-1 w-full flex flex-col gap-2">
                        <label className="text-gray-400 font-bold text-xs uppercase">ตัวทำคณิต (B)</label>
                        <div className="flex gap-2">
                           <input type="text" value={calcB} onChange={(e) => setCalcB(e.target.value)} placeholder="0" className={`w-full p-3 border-2 bg-gray-900/80 text-white font-bold text-lg uppercase rounded-xl outline-none transition-all ${!isBValid && calcB ? 'border-red-500/50' : 'border-white/10 focus:border-pink-500'}`} />
                           <select value={calcBaseB} onChange={(e) => setCalcBaseB(Number(e.target.value) as BaseOption)} className="w-24 p-3 bg-gray-900/80 border border-white/10 rounded-xl text-gray-300 outline-none font-bold">
                              <option value={2}>ฐาน 2</option><option value={8}>ฐาน 8</option><option value={10}>ฐาน 10</option><option value={16}>ฐาน 16</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-6 bg-gray-900/80 rounded-xl border border-white/5 relative shadow-inner">
                     <span className="absolute -top-3.5 bg-gray-800/90 backdrop-blur-sm px-4 py-1 rounded-full text-xs font-bold text-emerald-400 border border-white/10 shadow-sm">ผลลัพธ์ (Result)</span>
                     
                     <div className="flex items-center gap-4 w-full justify-center">
                        <span className="text-4xl md:text-5xl font-black text-white break-all text-center">
                           {errorMsg ? <span className="text-red-400 text-2xl">{errorMsg}</span> : (calcFinalResult || '0')}
                        </span>
                        {!errorMsg && calcFinalResult && (
                           <select value={calcBaseOut} onChange={(e) => setCalcBaseOut(Number(e.target.value) as BaseOption)} className="p-2 bg-gray-800 border border-white/10 rounded-lg text-emerald-300 outline-none font-bold text-sm mt-3 shadow-sm">
                              <option value={2}>ฐาน 2</option><option value={8}>ฐาน 8</option><option value={10}>ฐาน 10</option><option value={16}>ฐาน 16</option>
                           </select>
                        )}
                     </div>
                  </div>

                  {calcA && calcB && isAValid && isBValid && (
                     <div className="border-t border-white/10 pt-6">
                        <button onClick={() => setShowCalcSteps(!showCalcSteps)} className="w-full py-3 px-4 bg-gray-900/80 hover:bg-gray-900 border border-white/10 rounded-xl text-gray-300 font-bold transition-colors flex items-center justify-center gap-2">
                           {showCalcSteps ? 'ซ่อนวิธีทำ' : 'ดูวิธีทำแบบละเอียด'}
                           <span className={`transform transition-transform ${showCalcSteps ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        
                        <div className={`transition-all duration-500 overflow-hidden ${showCalcSteps ? 'max-h-250 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                           <div className="bg-gray-900/80 p-6 rounded-xl border border-white/5 text-base shadow-inner">
                              {generateCalcSteps()}
                           </div>
                        </div>
                     </div>
                  )}

               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}