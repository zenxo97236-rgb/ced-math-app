'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function ConverterApp() {
  const [activeTab, setActiveTab] = useState<'convert' | 'math'>(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'convert' || tab === 'math') return tab;
    }
    return 'convert';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: 'convert' | 'math') => {
    if (activeTab === tab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
      if (typeof window !== 'undefined') window.history.replaceState(null, '', `?tab=${tab}`);
    }, 250);
    setIsMobileMenuOpen(false);
  };

  const [fromBase, setFromBase] = useState<number>(10);
  const [toBase, setToBase] = useState<number>(2);
  const [convInput, setConvInput] = useState<string>('');
  const [showProofModal, setShowProofModal] = useState(false);

  const [mathBase, setMathBase] = useState<number>(2);
  const [mathOp, setMathOp] = useState<'+' | '-' | '*' | '/'>('+');
  const [mathA, setMathA] = useState<string>('');
  const [mathB, setMathB] = useState<string>('');

  const isValidInput = (val: string, base: number) => {
    if (!val) return true;
    const regexMap: Record<number, RegExp> = {
      2: /^[01]+$/,
      8: /^[0-7]+$/,
      10: /^[0-9]+$/,
      16: /^[0-9A-Fa-f]+$/
    };
    return regexMap[base].test(val);
  };

  const convertedValue = () => {
    if (!convInput || !isValidInput(convInput, fromBase)) return '';
    const decimal = parseInt(convInput, fromBase);
    return decimal.toString(toBase).toUpperCase();
  };

  const getConversionSteps = () => {
    if (!convInput || !isValidInput(convInput, fromBase)) return [];
    const decVal = parseInt(convInput, fromBase);
    const steps: string[] = [];

    if (fromBase !== 10) {
      steps.push(`1. แปลง ${convInput.toUpperCase()} (ฐาน ${fromBase}) เป็นฐาน 10:`);
      const valStr = convInput.toUpperCase();
      const sumStr = [];
      for (let i = 0; i < valStr.length; i++) {
        const digit = parseInt(valStr[i], fromBase);
        const power = valStr.length - 1 - i;
        sumStr.push(`(${digit} × ${fromBase}^${power})`);
      }
      steps.push(`= ${sumStr.join(' + ')}`);
      steps.push(`= ${decVal} (ฐาน 10)`);
    }

    if (toBase !== 10) {
      if (fromBase !== 10) steps.push(`\n2. แปลง ${decVal} (ฐาน 10) เป็นฐาน ${toBase}:`);
      else steps.push(`แปลง ${decVal} (ฐาน 10) เป็นฐาน ${toBase}:`);

      let current = decVal;
      if (current === 0) {
        steps.push(`0 ÷ ${toBase} = 0 เศษ 0`);
      } else {
        while (current > 0) {
          const remainder = current % toBase;
          const next = Math.floor(current / toBase);
          steps.push(`${current} ÷ ${toBase} = ${next} เศษ ${remainder.toString(16).toUpperCase()}`);
          current = next;
        }
      }
      steps.push(`\nอ่านเศษจากล่างขึ้นบน = ${decVal.toString(toBase).toUpperCase()} (ฐาน ${toBase})`);
    }

    if (fromBase === 10 && toBase === 10) steps.push(`ค่าเท่าเดิม: ${convInput}`);
    return steps;
  };

  const calcMath = () => {
    if (!mathA || !mathB || !isValidInput(mathA, mathBase) || !isValidInput(mathB, mathBase)) return '';
    const decA = parseInt(mathA, mathBase);
    const decB = parseInt(mathB, mathBase);
    let resDec = 0;
    
    switch(mathOp) {
      case '+': resDec = decA + decB; break;
      case '-': resDec = decA - decB; break;
      case '*': resDec = decA * decB; break;
      case '/': resDec = Math.floor(decA / decB); break; 
    }
    
    if (resDec < 0 || isNaN(resDec)) return 'Error';
    return resDec.toString(mathBase).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30">
      
      <aside className="w-full md:w-64 bg-gray-900 shadow-xl border-b md:border-r border-gray-800 flex flex-col shrink-0 md:h-screen md:sticky md:top-0 z-40">
        <div className="p-5 flex items-center justify-between shrink-0 border-b border-gray-800/50">
          <Link href="/" className="group flex items-center gap-3 text-lg font-extrabold text-white hover:text-gray-300 transition-colors">
            <span className="text-xl">⌂</span> CED
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col p-4 gap-3 flex-1 overflow-y-auto scrollbar-hide mt-4`}>
          <Link href="/matrix" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">
            Matrix
          </Link>
          <Link href="/logic" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">
            Logic
          </Link>
          <Link href="/converter" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 transition-all">
            Number System
          </Link>
          <Link href="/boolean" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">
            Boolean
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 md:h-screen overflow-y-auto">
        <div className="bg-gray-900 border-b border-gray-800 pt-6 md:pt-10 px-4 md:px-10 sticky top-0 z-20 shadow-sm">
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-wide mb-6">
            ระบบเลขฐาน (Number System)
          </h1>
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            <button onClick={() => handleTabChange('convert')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'convert' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>แปลงเลขฐาน</button>
            <button onClick={() => handleTabChange('math')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'math' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>การคำนวณ</button>
          </div>
        </div>

        <div key={activeTab} className={`p-4 md:p-10 flex flex-col items-center w-full transition-all duration-300 ease-in-out transform ${isTransitioning ? 'opacity-0 translate-y-4 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'}`}>
          {activeTab === 'convert' && (
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className="bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-700 w-full mb-8 grid grid-cols-1 md:grid-cols-2 gap-8 hover:border-gray-600 transition-colors">
                
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <label className="text-gray-300 font-bold text-lg tracking-wide">แปลงจากฐาน:</label>
                    <select className="bg-gray-900 border border-gray-600 text-white font-bold p-2 rounded-lg outline-none" value={fromBase} onChange={(e) => setFromBase(Number(e.target.value))}>
                      <option value={2}>ฐาน 2 (Binary)</option>
                      <option value={8}>ฐาน 8 (Octal)</option>
                      <option value={10}>ฐาน 10 (Decimal)</option>
                      <option value={16}>ฐาน 16 (Hexadecimal)</option>
                    </select>
                  </div>
                  <input 
                    type="text" 
                    value={convInput} 
                    onChange={(e) => setConvInput(e.target.value.toUpperCase())}
                    placeholder="ป้อนตัวเลข..."
                    className={`w-full p-4 border-2 bg-gray-900 text-white font-bold text-2xl tracking-widest uppercase ${isValidInput(convInput, fromBase) ? 'border-gray-600 focus:border-emerald-500' : 'border-red-500/50 focus:border-red-500'} rounded-xl outline-none transition-all shadow-inner`}
                  />
                  {!isValidInput(convInput, fromBase) && (
                    <p className="text-red-400 text-sm font-medium">ตัวเลขไม่ถูกต้องสำหรับฐาน {fromBase}</p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <label className="text-gray-300 font-bold text-lg tracking-wide">ไปเป็นฐาน:</label>
                    <select className="bg-gray-900 border border-gray-600 text-white font-bold p-2 rounded-lg outline-none" value={toBase} onChange={(e) => setToBase(Number(e.target.value))}>
                      <option value={2}>ฐาน 2 (Binary)</option>
                      <option value={8}>ฐาน 8 (Octal)</option>
                      <option value={10}>ฐาน 10 (Decimal)</option>
                      <option value={16}>ฐาน 16 (Hexadecimal)</option>
                    </select>
                  </div>
                  <div className="w-full p-4 border-2 border-emerald-500/50 bg-gray-900/80 text-emerald-400 font-bold text-2xl tracking-widest rounded-xl shadow-inner min-h-17 flex items-center">
                    {convertedValue() || '-'}
                  </div>
                </div>
              </div>

              {convInput && isValidInput(convInput, fromBase) && (
                <div className="w-full flex justify-end">
                   <button 
                      onClick={() => setShowProofModal(true)} 
                      className="px-6 py-3 bg-gray-800 border border-emerald-500/50 text-emerald-400 hover:bg-gray-700 hover:text-emerald-300 active:scale-95 font-bold rounded-xl transition-all shadow-sm w-full md:w-auto tracking-wide"
                    >
                      ดูวิธีทำทีละขั้นตอน
                    </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'math' && (
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className="bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-700 w-full mb-8 hover:border-gray-600 transition-colors">
                <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                  <span className="text-gray-300 font-bold text-lg tracking-wide">เลือกฐานสำหรับการคำนวณ:</span>
                  <select className="bg-gray-900 border border-gray-600 text-white font-bold p-2 px-4 rounded-lg outline-none" value={mathBase} onChange={(e) => setMathBase(Number(e.target.value))}>
                    <option value={2}>ฐาน 2</option>
                    <option value={8}>ฐาน 8</option>
                    <option value={10}>ฐาน 10</option>
                    <option value={16}>ฐาน 16</option>
                  </select>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                  <div className="w-full flex-1">
                    <input 
                      type="text" 
                      value={mathA} 
                      onChange={(e) => setMathA(e.target.value.toUpperCase())}
                      placeholder="ตัวตั้ง"
                      className={`w-full p-4 border-2 bg-gray-900 text-white font-bold text-xl tracking-widest text-center ${isValidInput(mathA, mathBase) ? 'border-gray-600 focus:border-emerald-500' : 'border-red-500/50 focus:border-red-500'} rounded-xl outline-none transition-all shadow-inner`}
                    />
                  </div>

                  <div className="shrink-0">
                    <select className="bg-gray-700 border-2 border-gray-500 text-white font-black text-2xl p-3 rounded-xl outline-none cursor-pointer hover:bg-gray-600 transition-colors" value={mathOp} onChange={(e) => setMathOp(e.target.value as '+' | '-' | '*' | '/')}>
                      <option value="+">+</option>
                      <option value="-">-</option>
                      <option value="*">×</option>
                      <option value="/">÷</option>
                    </select>
                  </div>

                  <div className="w-full flex-1">
                    <input 
                      type="text" 
                      value={mathB} 
                      onChange={(e) => setMathB(e.target.value.toUpperCase())}
                      placeholder="ตัวกระทำ"
                      className={`w-full p-4 border-2 bg-gray-900 text-white font-bold text-xl tracking-widest text-center ${isValidInput(mathB, mathBase) ? 'border-gray-600 focus:border-emerald-500' : 'border-red-500/50 focus:border-red-500'} rounded-xl outline-none transition-all shadow-inner`}
                    />
                  </div>
                </div>

                <div className="flex justify-center my-6">
                  <span className="text-4xl font-black text-gray-600">=</span>
                </div>

                <div className="w-full p-5 border-2 border-emerald-500/50 bg-gray-950 text-emerald-400 font-black text-3xl tracking-widest rounded-xl shadow-lg text-center flex flex-col items-center">
                  <span className="text-sm font-bold text-gray-500 tracking-normal mb-2 uppercase">RESULT (ฐาน {mathBase})</span>
                  {calcMath() || '-'}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md transition-opacity">
          <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900 shrink-0">
              <h3 className="text-xl font-extrabold text-gray-100 tracking-wide">วิธีทำทีละขั้นตอน</h3>
              <button onClick={() => setShowProofModal(false)} className="text-gray-500 hover:text-white transition text-4xl leading-none px-2 rounded-lg hover:bg-gray-800 active:scale-90">&times;</button>
            </div>
            <div className="p-8 md:p-10 flex-1 overflow-y-auto flex flex-col items-center">
              <p className="text-gray-300 mb-8 w-full text-left font-bold text-lg border-l-4 border-emerald-500 pl-4 tracking-wide">
                การแปลง {convInput.toUpperCase()} ฐาน {fromBase} ไปเป็นฐาน {toBase}
              </p>
              <div className="font-mono text-lg text-gray-200 w-full bg-gray-950 p-8 rounded-2xl border border-gray-800 shadow-inner overflow-x-auto flex flex-col gap-3">
                {getConversionSteps().map((step, idx) => (
                  <div key={idx} className={`${step.startsWith('1.') || step.startsWith('2.') ? 'text-emerald-400 font-bold mt-4 mb-2' : 'ml-4'} whitespace-pre-wrap`}>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}