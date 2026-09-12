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
    <button onClick={() => insertAtCursor(' ∧ ', setter, inputRef)} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 active:scale-95 border border-gray-700 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">∧ (และ)</button>
    <button onClick={() => insertAtCursor(' ∨ ', setter, inputRef)} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 active:scale-95 border border-gray-700 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">∨ (หรือ)</button>
    <button onClick={() => insertAtCursor(' → ', setter, inputRef)} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 active:scale-95 border border-gray-700 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">→ (ถ้า...แล้ว)</button>
    <button onClick={() => insertAtCursor(' ↔ ', setter, inputRef)} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 active:scale-95 border border-gray-700 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">↔ (ก็ต่อเมื่อ)</button>
    <button onClick={() => insertAtCursor('~', setter, inputRef)} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 active:scale-95 border border-gray-700 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">~ (นิเสธ)</button>
    <button onClick={() => insertAtCursor('()', setter, inputRef)} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 active:scale-95 border border-gray-700 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">( )</button>
  </div>
);

export default function LogicApp() {
  const [activeTab, setActiveTab] = useState<'truth_table' | 'equivalence'>(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'truth_table' || tab === 'equivalence') return tab;
    }
    return 'truth_table';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: 'truth_table' | 'equivalence') => {
    if (activeTab === tab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
      if (typeof window !== 'undefined') window.history.replaceState(null, '', `?tab=${tab}`);
    }, 250);
    setIsMobileMenuOpen(false);
  };

  const [expression, setExpression] = useState('p → (q ∧ r)');
  const [exprA, setExprA] = useState('p → (q ∧ r)');
  const [exprB, setExprB] = useState('(p → q) ∧ (p → r)');
  const [showProofModal, setShowProofModal] = useState(false);

  const inputRefTT = useRef<HTMLInputElement>(null);
  const inputRefEqA = useRef<HTMLInputElement>(null);
  const inputRefEqB = useRef<HTMLInputElement>(null);

  const getVariables = (expr: string) => {
    const rawVars = expr.match(/[a-uw-zA-UW-Z]/g) || [];
    return Array.from(new Set(rawVars)).sort().slice(0, 4);
  };
  const getCombinedVars = (e1: string, e2: string) => {
    const rawVars = (e1 + e2).match(/[a-uw-zA-UW-Z]/g) || [];
    return Array.from(new Set(rawVars)).sort().slice(0, 4);
  };

  const generateRows = (vars: string[]) => {
    if (vars.length === 0) return [];
    const r = [];
    const numRows = Math.pow(2, vars.length);
    for (let i = 0; i < numRows; i++) {
      const rowVals: Record<string, boolean> = {};
      vars.forEach((vari, idx) => {
        rowVals[vari] = Boolean((numRows - 1 - i) >> (vars.length - 1 - idx) & 1);
      });
      r.push(rowVals);
    }
    return r;
  };

  const evaluateExpr = (exprStr: string, rowVals: Record<string, boolean>) => {
    if (!exprStr.trim()) return null;
    try {
      let expr = exprStr;
      expr = expr.replace(/<->|↔/g, '==='); 
      expr = expr.replace(/->|→/g, '<=');   
      expr = expr.replace(/v|∨/gi, '||');   
      expr = expr.replace(/\^|∧/g, '&&');   
      expr = expr.replace(/~/g, '!');       
      expr = expr.replace(/\(not\)/gi, '&& !'); 
      Object.entries(rowVals).forEach(([key, val]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expr = expr.replace(regex, val ? 'true' : 'false');
      });
      const result = new Function(`return !!(${expr})`)();
      return result;
    } catch {
      return null;
    }
  };

  const varsTT = getVariables(expression);
  const rowsTT = generateRows(varsTT);
  const isValidTT = rowsTT.length > 0 && evaluateExpr(expression, rowsTT[0]) !== null;
  const isTautology = isValidTT && rowsTT.every(row => evaluateExpr(expression, row) === true);

  const varsEq = getCombinedVars(exprA, exprB);
  const rowsEq = generateRows(varsEq);
  const isValidA = rowsEq.length > 0 && evaluateExpr(exprA, rowsEq[0]) !== null;
  const isValidB = rowsEq.length > 0 && evaluateExpr(exprB, rowsEq[0]) !== null;
  const isEquivalent = isValidA && isValidB && rowsEq.every(row => evaluateExpr(exprA, row) === evaluateExpr(exprB, row));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 text-gray-100 font-sans selection:bg-indigo-500/30">
      
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
          <Link href="/logic" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 transition-all">
            Logic
          </Link>
          <Link href="/converter" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">
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
            ตรรกศาสตร์ (Logic)
          </h1>
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            <button onClick={() => handleTabChange('truth_table')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'truth_table' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>ตารางค่าความจริง</button>
            <button onClick={() => handleTabChange('equivalence')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'equivalence' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>พิสูจน์ความสมมูล</button>
          </div>
        </div>

        <div key={activeTab} className={`p-4 md:p-10 flex flex-col items-center w-full transition-all duration-300 ease-in-out transform ${isTransitioning ? 'opacity-0 translate-y-4 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'}`}>
          {activeTab === 'truth_table' && (
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className="bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-700 w-full mb-10 hover:border-gray-600 transition-colors">
                <label className="block text-gray-300 font-bold mb-4 text-lg tracking-wide">รูปแบบประพจน์:</label>
                <SymbolButtons setter={setExpression} inputRef={inputRefTT} />
                <input 
                  ref={inputRefTT}
                  type="text" 
                  value={expression} 
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="เช่น p → (q ∧ r)"
                  className={`w-full p-4 border-2 bg-gray-900 text-white font-bold text-xl md:text-2xl tracking-wide ${isValidTT ? 'border-gray-600 focus:border-indigo-500' : 'border-red-500/50 focus:border-red-500'} rounded-xl outline-none transition-all shadow-inner`}
                />
                {!isValidTT && expression.trim() !== '' && (
                  <p className="text-red-400 text-sm mt-3 font-medium">รูปแบบประพจน์ไม่สมบูรณ์ โปรดตรวจสอบวงเล็บหรือเครื่องหมาย</p>
                )}
              </div>

              {isValidTT && isTautology && (
                <div className="w-full mb-8 bg-green-900/20 border border-green-500/40 text-green-400 p-6 rounded-2xl shadow-sm flex flex-col gap-1">
                  <p className="font-extrabold text-xl tracking-wide text-green-300">สัจนิรันดร์</p>
                  <p className="text-sm font-medium opacity-90">รูปแบบประพจน์นี้มีค่าความจริงเป็นจริง (T) เสมอในทุกกรณี</p>
                </div>
              )}

              <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 w-full overflow-hidden">
                {varsTT.length === 0 ? (
                  <p className="text-center text-gray-500 font-bold py-16 text-lg tracking-wide bg-gray-900/50">พิมพ์ตัวแปรเพื่อสร้างตาราง</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="bg-gray-900 border-b-2 border-gray-800">
                          {varsTT.map(v => (
                            <th key={`th-${v}`} className="p-5 text-gray-300 font-black text-xl w-24">{v}</th>
                          ))}
                          <th className="p-5 text-indigo-400 font-extrabold text-lg border-l-2 border-gray-800 bg-gray-900/50">
                            <span className="font-mono text-sm opacity-60 block mb-2 font-normal tracking-wider">{expression}</span>
                            RESULT
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {rowsTT.map((rowVals, i) => {
                          const result = evaluateExpr(expression, rowVals);
                          return (
                            <tr key={`row-${i}`} className="hover:bg-gray-700/50 transition-colors">
                              {varsTT.map(v => (
                                <td key={`td-${i}-${v}`} className="p-4">
                                  <span className={`inline-block w-12 h-12 leading-12 text-center rounded-xl font-bold text-xl ${rowVals[v] ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                    {rowVals[v] ? 'T' : 'F'}
                                  </span>
                                </td>
                              ))}
                              <td className="p-4 border-l-2 border-gray-800 bg-gray-900/30">
                                 <span className={`inline-block px-6 py-3 rounded-xl font-extrabold text-xl shadow-sm border-2 ${result === true ? 'bg-green-600 text-white border-green-500' : result === false ? 'bg-red-600 text-white border-red-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                                  {result === true ? 'T' : result === false ? 'F' : '-'}
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

          {activeTab === 'equivalence' && (
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className="bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-700 w-full mb-8 grid grid-cols-1 md:grid-cols-2 gap-8 hover:border-gray-600 transition-colors">
                <div className="flex flex-col">
                  <label className="block text-gray-300 font-bold mb-4 text-lg tracking-wide">ประพจน์ที่ 1 (A):</label>
                  <SymbolButtons setter={setExprA} inputRef={inputRefEqA} />
                  <input 
                    ref={inputRefEqA}
                    type="text" 
                    value={exprA} 
                    onChange={(e) => setExprA(e.target.value)}
                    className={`w-full p-4 border-2 bg-gray-900 text-white font-bold text-xl tracking-wide ${isValidA ? 'border-gray-600 focus:border-indigo-500' : 'border-red-500/50 focus:border-red-500'} rounded-xl outline-none transition-all shadow-inner`}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="block text-gray-300 font-bold mb-4 text-lg tracking-wide">ประพจน์ที่ 2 (B):</label>
                  <SymbolButtons setter={setExprB} inputRef={inputRefEqB} />
                  <input 
                    ref={inputRefEqB}
                    type="text" 
                    value={exprB} 
                    onChange={(e) => setExprB(e.target.value)}
                    className={`w-full p-4 border-2 bg-gray-900 text-white font-bold text-xl tracking-wide ${isValidB ? 'border-gray-600 focus:border-purple-500' : 'border-red-500/50 focus:border-red-500'} rounded-xl outline-none transition-all shadow-inner`}
                  />
                </div>
              </div>

              {isValidA && isValidB && (
                <div className={`w-full mb-8 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm border gap-6 ${isEquivalent ? 'bg-green-900/20 border-green-500/40 text-green-400' : 'bg-red-900/20 border-red-500/40 text-red-400'}`}>
                  <div className="flex flex-col gap-1">
                    <p className={`font-extrabold text-xl tracking-wide ${isEquivalent ? 'text-green-300' : 'text-red-300'}`}>{isEquivalent ? 'สมมูลกัน' : 'ไม่สมมูลกัน'}</p>
                    <p className="text-sm font-medium opacity-90">
                      {isEquivalent ? 'ประพจน์ทั้งสองมีค่าความจริงตรงกันทุกกรณี' : 'ประพจน์ทั้งสองมีค่าความจริงไม่ตรงกันในบางกรณี'}
                    </p>
                  </div>
                  {isEquivalent && (
                    <button 
                      onClick={() => setShowProofModal(true)} 
                      className="px-6 py-3 bg-gray-800 border border-green-500/50 text-green-400 hover:bg-gray-700 hover:text-green-300 active:scale-95 font-bold rounded-xl transition-all shadow-sm w-full md:w-auto tracking-wide"
                    >
                      วิธีทำ
                    </button>
                  )}
                </div>
              )}

              <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 w-full overflow-hidden">
                {varsEq.length === 0 ? (
                  <p className="text-center text-gray-500 font-bold py-16 text-lg tracking-wide bg-gray-900/50">พิมพ์ตัวแปรเพื่อสร้างตารางเปรียบเทียบ</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="bg-gray-900 border-b-2 border-gray-800">
                          {varsEq.map(v => (
                            <th key={`th-${v}`} className="p-5 text-gray-300 font-black text-xl w-20">{v}</th>
                          ))}
                          <th className="p-5 text-indigo-400 font-extrabold text-lg border-l-2 border-gray-800 bg-gray-900/50 w-1/3">
                            <span className="font-mono text-sm opacity-60 block mb-2 font-normal tracking-wider">{exprA || '-'}</span>
                            RESULT A
                          </th>
                          <th className="p-5 text-purple-400 font-extrabold text-lg border-l-2 border-gray-800 bg-gray-900/50 w-1/3">
                            <span className="font-mono text-sm opacity-60 block mb-2 font-normal tracking-wider">{exprB || '-'}</span>
                            RESULT B
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {rowsEq.map((rowVals, i) => {
                          const resA = evaluateExpr(exprA, rowVals);
                          const resB = evaluateExpr(exprB, rowVals);
                          const isMatch = resA === resB;

                          return (
                            <tr key={`row-${i}`} className={`transition-colors ${isMatch ? 'hover:bg-gray-700/50' : 'bg-red-900/10 hover:bg-red-900/20'}`}>
                              {varsEq.map(v => (
                                <td key={`td-${i}-${v}`} className="p-4">
                                  <span className={`inline-block w-10 h-10 leading-10 text-center rounded-xl font-bold text-lg ${rowVals[v] ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                    {rowVals[v] ? 'T' : 'F'}
                                  </span>
                                </td>
                              ))}
                              <td className="p-4 border-l-2 border-gray-800 bg-gray-900/30">
                                 <span className={`inline-block px-5 py-2.5 rounded-xl font-extrabold text-lg shadow-sm border-2 ${resA === true ? 'bg-green-600 text-white border-green-500' : resA === false ? 'bg-red-600 text-white border-red-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                                  {resA === true ? 'T' : resA === false ? 'F' : '-'}
                                </span>
                              </td>
                              <td className="p-4 border-l-2 border-gray-800 bg-gray-900/30">
                                 <span className={`inline-block px-5 py-2.5 rounded-xl font-extrabold text-lg shadow-sm border-2 ${resB === true ? 'bg-green-600 text-white border-green-500' : resB === false ? 'bg-red-600 text-white border-red-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                                  {resB === true ? 'T' : resB === false ? 'F' : '-'}
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
        </div>
      </main>

      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md transition-opacity">
          <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900 shrink-0">
              <h3 className="text-xl font-extrabold text-gray-100 tracking-wide">
                วิธีทำ
              </h3>
              <button onClick={() => setShowProofModal(false)} className="text-gray-500 hover:text-white transition text-4xl leading-none px-2 rounded-lg hover:bg-gray-800 active:scale-90">
                &times;
              </button>
            </div>
            <div className="p-8 md:p-10 flex-1 overflow-y-auto flex flex-col items-center">
              <p className="text-gray-300 mb-8 w-full text-left font-bold text-lg border-l-4 border-indigo-500 pl-4 wrap-break-word tracking-wide">
                ตัวอย่างการจัดรูปประพจน์: p → (q ∧ r) สมมูลกับ (p → q) ∧ (p → r)
              </p>
              <div className="font-mono text-lg md:text-xl text-gray-200 w-full bg-gray-950 p-8 rounded-2xl border border-gray-800 shadow-inner overflow-x-auto">
                <div className="grid grid-cols-[auto_auto_1fr] gap-x-5 gap-y-6 min-w-max mx-auto items-center">
                  <div className="text-right font-black text-indigo-400 whitespace-nowrap">p → (q ∧ r)</div>
                  <div className="text-gray-600 font-bold">≡</div>
                  <div className="text-left font-medium whitespace-nowrap">~p ∨ (q ∧ r)</div>
                  <div></div>
                  <div className="text-gray-600 font-bold">≡</div>
                  <div className="text-left font-medium whitespace-nowrap">(~p ∨ q) ∧ (~p ∨ r)</div>
                  <div></div>
                  <div className="text-gray-600 font-bold">≡</div>
                  <div className="text-left font-black text-green-400 whitespace-nowrap">(p → q) ∧ (p → r)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}