'use client';
import Link from 'next/link';
import { useState, useRef } from 'react';

const insertAtCursor = (
  sym: string,
  setter: React.Dispatch<React.SetStateAction<string>>,
  inputRef: React.RefObject<HTMLInputElement | null>
) => {
  if (inputRef.current) {
    const input = inputRef.current;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    setter(prev => {
      const newVal = prev.substring(0, start) + sym + prev.substring(end);
      setTimeout(() => {
        const newPos = sym === '()' ? start + 1 : start + sym.length;
        input.setSelectionRange(newPos, newPos);
        input.focus();
      }, 0);
      return newVal;
    });
  } else {
    setter(prev => prev + sym);
  }
};

const SymbolButtons = ({ setter, inputRef }: { setter: React.Dispatch<React.SetStateAction<string>>, inputRef: React.RefObject<HTMLInputElement | null> }) => (
  <div className="flex flex-wrap gap-3 mb-4">
    <button onClick={() => insertAtCursor(' * ', setter, inputRef)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 active:scale-95 border border-gray-600 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">* (AND)</button>
    <button onClick={() => insertAtCursor(' + ', setter, inputRef)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 active:scale-95 border border-gray-600 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">+ (OR)</button>
    <button onClick={() => insertAtCursor('!', setter, inputRef)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 active:scale-95 border border-gray-600 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">! (NOT)</button>
    <button onClick={() => insertAtCursor(' ⊕ ', setter, inputRef)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 active:scale-95 border border-gray-600 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">⊕ (XOR)</button>
    <button onClick={() => insertAtCursor('()', setter, inputRef)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 active:scale-95 border border-gray-600 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">( )</button>
  </div>
);

export default function BooleanApp() {
  const [activeTab, setActiveTab] = useState<'algebra' | 'gates'>(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'algebra' || tab === 'gates') return tab;
    }
    return 'algebra';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: 'algebra' | 'gates') => {
    if (activeTab === tab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
      if (typeof window !== 'undefined') window.history.replaceState(null, '', `?tab=${tab}`);
    }, 250);
    setIsMobileMenuOpen(false);
  };

  const [expression, setExpression] = useState('A * B + !C');
  const inputRefAlg = useRef<HTMLInputElement>(null);

  const [gateType, setGateType] = useState<'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'XNOR'>('AND');
  const [inputA, setInputA] = useState<0 | 1>(0);
  const [inputB, setInputB] = useState<0 | 1>(0);

  const getVariables = (expr: string) => {
    const rawVars = expr.match(/[A-Za-z]/g) || [];
    return Array.from(new Set(rawVars.map(v => v.toUpperCase()))).sort().slice(0, 4); 
  };

  const generateRows = (vars: string[]) => {
    if (vars.length === 0) return [];
    const r = [];
    const numRows = Math.pow(2, vars.length);
    for (let i = 0; i < numRows; i++) {
      const rowVals: Record<string, number> = {};
      vars.forEach((vari, idx) => {
        rowVals[vari] = (numRows - 1 - i) >> (vars.length - 1 - idx) & 1;
      });
      r.push(rowVals);
    }
    return r;
  };

  const evaluateBoolean = (exprStr: string, rowVals: Record<string, number>) => {
    if (!exprStr.trim()) return null;
    try {
      let expr = exprStr.toUpperCase();
      expr = expr.replace(/⊕/g, '!=='); 
      expr = expr.replace(/\+/g, '||'); 
      expr = expr.replace(/\*/g, '&&'); 
      expr = expr.replace(/!/g, '!');   
      
      Object.entries(rowVals).forEach(([key, val]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expr = expr.replace(regex, val === 1 ? 'true' : 'false');
      });

      const result = new Function(`return !!(${expr})`)();
      return result ? 1 : 0;
    } catch {
      return null;
    }
  };

  const calcGate = () => {
    switch (gateType) {
      case 'AND': return (inputA && inputB) ? 1 : 0;
      case 'OR': return (inputA || inputB) ? 1 : 0;
      case 'NAND': return !(inputA && inputB) ? 1 : 0;
      case 'NOR': return !(inputA || inputB) ? 1 : 0;
      case 'XOR': return (inputA !== inputB) ? 1 : 0;
      case 'XNOR': return (inputA === inputB) ? 1 : 0;
      default: return 0;
    }
  };

  const vars = getVariables(expression);
  const rows = generateRows(vars);
  const isValid = rows.length > 0 && evaluateBoolean(expression, rows[0]) !== null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 text-gray-100 font-sans selection:bg-purple-500/30">
      
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
          <Link href="/converter" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">
            Number System
          </Link>
          <Link href="/boolean" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-purple-600 text-white shadow-lg shadow-purple-900/20 transition-all">
            Boolean
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 md:h-screen overflow-y-auto">
        <div className="bg-gray-900 border-b border-gray-800 pt-6 md:pt-10 px-4 md:px-10 sticky top-0 z-20 shadow-sm">
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-wide mb-6">
            พีชคณิตบูลีน (Boolean)
          </h1>
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            <button onClick={() => handleTabChange('algebra')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'algebra' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>สมการบูลีน (0,1)</button>
            <button onClick={() => handleTabChange('gates')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'gates' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>ลอจิกเกตพื้นฐาน</button>
          </div>
        </div>

        <div key={activeTab} className={`p-4 md:p-10 flex flex-col items-center w-full transition-all duration-300 ease-in-out transform ${isTransitioning ? 'opacity-0 translate-y-4 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'}`}>
          {activeTab === 'algebra' && (
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className="bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-700 w-full mb-10 hover:border-gray-600 transition-colors">
                <label className="block text-gray-300 font-bold mb-4 text-lg tracking-wide">รูปแบบสมการบูลีน:</label>
                <SymbolButtons setter={setExpression} inputRef={inputRefAlg} />
                <input 
                  ref={inputRefAlg}
                  type="text" 
                  value={expression} 
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="เช่น A * B + !C"
                  className={`w-full p-4 border-2 bg-gray-900 text-white font-bold text-xl md:text-2xl tracking-wide uppercase ${isValid ? 'border-gray-600 focus:border-purple-500' : 'border-red-500/50 focus:border-red-500'} rounded-xl outline-none transition-all shadow-inner`}
                />
                {!isValid && expression.trim() !== '' && (
                  <p className="text-red-400 text-sm mt-3 font-medium">สมการไม่สมบูรณ์ โปรดตรวจสอบวงเล็บหรือเครื่องหมาย</p>
                )}
              </div>

              <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 w-full overflow-hidden">
                {vars.length === 0 ? (
                  <p className="text-center text-gray-500 font-bold py-16 text-lg tracking-wide bg-gray-900/50">พิมพ์ตัวแปร (เช่น A, B, C) เพื่อสร้างตารางค่าความจริง</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="bg-gray-900 border-b-2 border-gray-800">
                          {vars.map(v => (
                            <th key={`th-${v}`} className="p-5 text-gray-300 font-black text-xl w-24">{v}</th>
                          ))}
                          <th className="p-5 text-purple-400 font-extrabold text-lg border-l-2 border-gray-800 bg-gray-900/50">
                            <span className="font-mono text-sm opacity-60 block mb-2 font-normal tracking-wider">{expression}</span>
                            OUTPUT (Y)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {rows.map((rowVals, i) => {
                          const result = evaluateBoolean(expression, rowVals);
                          return (
                            <tr key={`row-${i}`} className="hover:bg-gray-800/50 transition-colors">
                              {vars.map(v => (
                                <td key={`td-${i}-${v}`} className="p-4">
                                  <span className={`inline-block w-12 h-12 leading-12 text-center rounded-xl font-bold text-xl ${rowVals[v] === 1 ? 'bg-purple-900/30 text-purple-400' : 'bg-gray-900 text-gray-400'}`}>
                                    {rowVals[v]}
                                  </span>
                                </td>
                              ))}
                              <td className="p-4 border-l-2 border-gray-800 bg-gray-900/30">
                                 <span className={`inline-block px-8 py-3 rounded-xl font-extrabold text-2xl shadow-sm border-2 ${result === 1 ? 'bg-purple-600 text-white border-purple-500' : result === 0 ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-900 text-gray-500 border-gray-800'}`}>
                                  {result !== null ? result : '-'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'gates' && (
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className="bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-700 w-full mb-8 hover:border-gray-600 transition-colors flex flex-col items-center">
                <div className="mb-8 w-full border-b border-gray-700 pb-6 flex justify-center">
                  <select className="bg-gray-900 border-2 border-purple-500/50 text-white font-black text-2xl p-4 px-8 rounded-xl outline-none cursor-pointer focus:border-purple-500 transition-all text-center tracking-widest" value={gateType} onChange={(e) => setGateType(e.target.value as 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'XNOR')}>
                    <option value="AND">AND Gate</option>
                    <option value="OR">OR Gate</option>
                    <option value="NAND">NAND Gate</option>
                    <option value="NOR">NOR Gate</option>
                    <option value="XOR">XOR Gate</option>
                    <option value="XNOR">XNOR Gate</option>
                  </select>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-lg justify-center mb-8">
                  <div className="flex flex-col items-center gap-3">
                    <span className="font-bold text-gray-400 tracking-wider">INPUT A</span>
                    <button onClick={() => setInputA(inputA === 1 ? 0 : 1)} className={`w-20 h-20 rounded-2xl font-black text-4xl shadow-md border-b-4 transition-all active:translate-y-1 active:border-b-0 ${inputA === 1 ? 'bg-purple-600 border-purple-800 text-white' : 'bg-gray-700 border-gray-900 text-gray-400'}`}>
                      {inputA}
                    </button>
                  </div>
                  <div className="shrink-0 flex items-center justify-center">
                    <span className="text-gray-600 text-5xl font-black px-4">➔</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <span className="font-bold text-gray-400 tracking-wider">INPUT B</span>
                    <button onClick={() => setInputB(inputB === 1 ? 0 : 1)} className={`w-20 h-20 rounded-2xl font-black text-4xl shadow-md border-b-4 transition-all active:translate-y-1 active:border-b-0 ${inputB === 1 ? 'bg-purple-600 border-purple-800 text-white' : 'bg-gray-700 border-gray-900 text-gray-400'}`}>
                      {inputB}
                    </button>
                  </div>
                </div>

                <div className="w-full flex justify-center mt-4">
                  <div className="flex flex-col items-center gap-3">
                    <span className="font-extrabold text-purple-400 tracking-widest text-lg">OUTPUT (Y)</span>
                    <div className={`w-32 h-32 rounded-3xl font-black text-6xl shadow-inner border-4 flex items-center justify-center transition-all ${calcGate() === 1 ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-gray-900 border-gray-700 text-gray-600'}`}>
                      {calcGate()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}