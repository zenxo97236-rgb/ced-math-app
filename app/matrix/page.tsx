'use client';
import Link from 'next/link';
import { useState, Fragment, useEffect } from 'react';

type MatrixData = {
  id: number;
  scalar: string;
  data: string[];
  operator: '+' | '-';
};

export default function MatrixApp() {
  const [activeTab, setActiveTab] = useState<'linear' | 'multiply' | 'advanced'>('linear');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'linear' || tab === 'multiply' || tab === 'advanced') {
        setTimeout(() => setActiveTab(tab as 'linear' | 'multiply' | 'advanced'), 0);
      }
    }
  }, []);

  const handleTabChange = (tab: 'linear' | 'multiply' | 'advanced') => {
    if (activeTab === tab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
      if (typeof window !== 'undefined') window.history.replaceState(null, '', `?tab=${tab}`);
    }, 300);
    setIsMobileMenuOpen(false);
  };

  const createEmptyMatrix = () => Array(16).fill('');
  const getNum = (val: string, defaultVal: number = 0) => {
    if (val === '') return defaultVal;
    if (val === '-') return -defaultVal;
    return Number(val) || 0;
  };

  const getLinearGridColsClass = (cols: number) => {
    if (cols === 1) return 'grid-cols-1';
    if (cols === 2) return 'grid-cols-2';
    if (cols === 3) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const formatRes = (val: number) => {
    if (Number.isInteger(val)) return val;
    return parseFloat(val.toFixed(3));
  };

  const [linearRows, setLinearRows] = useState(2);
  const [linearCols, setLinearCols] = useState(2);
  const matrixNames = ['A', 'B', 'C', 'D', 'E', 'F'];
  const [matrices, setMatrices] = useState<MatrixData[]>([
    { id: 1, scalar: '', data: createEmptyMatrix(), operator: '+' },
    { id: 2, scalar: '', data: createEmptyMatrix(), operator: '+' },
  ]);

  const calculateResult = (index: number) => {
    return matrices.reduce((sum, mat, i) => {
      const k = getNum(mat.scalar, 1);
      const val = getNum(mat.data[index], 0);
      const sign = (i > 0 && mat.operator === '-') ? -1 : 1;
      return sum + (sign * k * val);
    }, 0);
  };
  const updateMatrixData = (matId: number, index: number, value: string) => setMatrices(prev => prev.map(m => m.id === matId ? { ...m, data: Object.assign([...m.data], { [index]: value }) } : m));
  const updateScalar = (matId: number, value: string) => setMatrices(prev => prev.map(m => m.id === matId ? { ...m, scalar: value } : m));
  const updateOperator = (matId: number, value: '+' | '-') => setMatrices(prev => prev.map(m => m.id === matId ? { ...m, operator: value } : m));
  const clearMatrix = (matId: number) => setMatrices(prev => prev.map(m => m.id === matId ? { ...m, data: createEmptyMatrix(), scalar: '' } : m));
  const addMatrix = () => {
    if (matrices.length >= 6) return alert('เพิ่มได้สูงสุด 6 เมทริกซ์');
    setMatrices(prev => [...prev, { id: Date.now(), scalar: '', data: createEmptyMatrix(), operator: '+' }]);
  };
  const removeMatrix = (matId: number) => setMatrices(prev => matrices.length > 1 ? prev.filter(m => m.id !== matId) : prev);

  const [rowA, setRowA] = useState(2);
  const [colA, setColA] = useState(2); 
  const [colB, setColB] = useState(2);
  const [matrixMultA, setMatrixMultA] = useState<string[]>(createEmptyMatrix());
  const [matrixMultB, setMatrixMultB] = useState<string[]>(createEmptyMatrix());
  const [scalarMultA, setScalarMultA] = useState('');
  const [scalarMultB, setScalarMultB] = useState('');

  const updateMultMatrix = (matrixTarget: 'A' | 'B', index: number, value: string) => {
    if (matrixTarget === 'A') setMatrixMultA(prev => Object.assign([...prev], { [index]: value }));
    else setMatrixMultB(prev => Object.assign([...prev], { [index]: value }));
  };
  const clearMultAll = () => {
    setMatrixMultA(createEmptyMatrix());
    setMatrixMultB(createEmptyMatrix());
    setScalarMultA('');
    setScalarMultB('');
  };
  const useResultAsA = () => {
    const newMatrixA = createEmptyMatrix();
    const kA = getNum(scalarMultA, 1);
    const kB = getNum(scalarMultB, 1);
    for (let r = 0; r < rowA; r++) {
      for (let c = 0; c < colB; c++) {
        let resultSum = 0;
        for (let k = 0; k < colA; k++) resultSum += (getNum(matrixMultA[r * 4 + k]) * kA) * (getNum(matrixMultB[k * 4 + c]) * kB);
        newMatrixA[r * 4 + c] = resultSum.toString();
      }
    }
    setColA(colB); 
    setMatrixMultA(newMatrixA);
    setMatrixMultB(createEmptyMatrix());
    setScalarMultA('');
    setScalarMultB('');
  };

  const [advRows, setAdvRows] = useState(2);
  const [advCols, setAdvCols] = useState(2);
  const [matrixAdv, setMatrixAdv] = useState<string[]>(createEmptyMatrix());
  const updateAdvMatrix = (index: number, value: string) => setMatrixAdv(prev => Object.assign([...prev], { [index]: value }));
  const clearAdvMatrix = () => setMatrixAdv(createEmptyMatrix());

  const calcDet = (matrix: number[][]): number => {
    const n = matrix.length;
    if (n === 1) return matrix[0][0];
    if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    let det = 0;
    for (let c = 0; c < n; c++) {
      const sub = matrix.slice(1).map(row => row.filter((_, colIdx) => colIdx !== c));
      det += Math.pow(-1, c) * matrix[0][c] * calcDet(sub);
    }
    return det;
  };

  const calcInv = (matrix: number[][], det: number): number[][] => {
    const n = matrix.length;
    if (n === 1) return [[1 / matrix[0][0]]];
    const adj = [];
    for (let r = 0; r < n; r++) {
      const adjRow = [];
      for (let c = 0; c < n; c++) {
        const sub = matrix.filter((_, rowIdx) => rowIdx !== c).map(row => row.filter((_, colIdx) => colIdx !== r));
        adjRow.push((Math.pow(-1, r + c) * calcDet(sub)) / det);
      }
      adj.push(adjRow);
    }
    return adj;
  };

  const isSquare = advRows === advCols;
  const adv2D: number[][] = [];
  for (let r = 0; r < advRows; r++) {
    const rowData = [];
    for (let c = 0; c < advCols; c++) rowData.push(getNum(matrixAdv[r * 4 + c]));
    adv2D.push(rowData);
  }
  const advDet = isSquare ? calcDet(adv2D) : null;
  const advInv = (isSquare && advDet !== null && advDet !== 0) ? calcInv(adv2D, advDet) : null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 text-gray-100 font-sans selection:bg-blue-500/30">
      
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
          <Link href="/matrix" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-blue-600/90 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-blue-500/50 transition-all">Matrix</Link>
          <Link href="/logic" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">Logic</Link>
          <Link href="/converter" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">Number System</Link>
          <Link href="/boolean" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">Boolean</Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar relative">
        <div className="md:hidden flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
          <span className="font-extrabold text-white text-lg">ระบบเมทริกซ์</span>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-400 hover:text-white">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        <div className="hidden md:block bg-gray-900/80 backdrop-blur-xl border-b border-white/10 pt-6 md:pt-10 px-4 md:px-10 sticky top-0 z-20 shadow-sm">
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-wide mb-6">ระบบเมทริกซ์ (Matrix)</h1>
          <div className="flex gap-6 overflow-x-auto custom-scrollbar">
            <button onClick={() => handleTabChange('linear')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'linear' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>บวก / ลบ / สเกลาร์</button>
            <button onClick={() => handleTabChange('multiply')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'multiply' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>คูณเมทริกซ์</button>
            <button onClick={() => handleTabChange('advanced')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'advanced' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>Transpose, Det, Inv</button>
          </div>
        </div>

        <div key={activeTab} className={`p-4 md:p-10 flex flex-col items-center w-full transition-all duration-300 ease-in-out transform ${isTransitioning ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>
          
          {activeTab === 'linear' && (
            <div className="w-full max-w-6xl">
              <div className="bg-gray-800/60 backdrop-blur-xl px-5 md:px-6 py-5 rounded-2xl shadow-sm border border-white/10 w-full mb-8 md:mb-10 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:border-white/20 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-5 w-full sm:w-auto">
                  <span className="font-bold text-gray-300 tracking-wide hidden sm:block">มิติเมทริกซ์:</span>
                  <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="flex flex-1 sm:flex-none items-center justify-between sm:justify-start gap-3 bg-gray-900/80 px-3 py-2 rounded-xl border border-white/10 focus-within:border-gray-500 transition-colors">
                      <span className="text-sm font-medium text-gray-400">แถว:</span>
                      <select className="bg-transparent text-white font-bold outline-none cursor-pointer" value={linearRows} onChange={e => setLinearRows(Number(e.target.value))}>
                        {[1, 2, 3, 4].map(n => <option key={`r-${n}`} value={n} className="bg-gray-800">{n}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-1 sm:flex-none items-center justify-between sm:justify-start gap-3 bg-gray-900/80 px-3 py-2 rounded-xl border border-white/10 focus-within:border-gray-500 transition-colors">
                      <span className="text-sm font-medium text-gray-400">หลัก:</span>
                      <select className="bg-transparent text-white font-bold outline-none cursor-pointer" value={linearCols} onChange={e => setLinearCols(Number(e.target.value))}>
                        {[1, 2, 3, 4].map(n => <option key={`c-${n}`} value={n} className="bg-gray-800">{n}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={addMatrix} className="px-5 py-3 sm:py-2.5 text-sm md:text-base bg-blue-600/20 text-blue-400 font-bold rounded-xl hover:bg-blue-600/30 active:scale-95 transition-all shadow-sm border border-blue-500/30 w-full sm:w-auto tracking-wide">
                  + เพิ่มเมทริกซ์
                </button>
              </div>

              <div className="flex flex-col md:flex-row flex-wrap gap-8 items-center justify-center w-full pb-10">
                {matrices.map((mat, i) => {
                  const k = getNum(mat.scalar, 1);
                  const isActiveScalar = mat.scalar !== '' && mat.scalar !== '1' && mat.scalar !== '-';
                  return (
                    <Fragment key={mat.id}>
                      {i > 0 && (
                        <div className="flex justify-center items-center shrink-0 px-2">
                          <button type="button" onClick={() => updateOperator(mat.id, mat.operator === '+' ? '-' : '+')} className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 active:scale-90 transition-all outline-none shadow-sm">
                            {mat.operator === '+' ? (
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                            ) : (
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/></svg>
                            )}
                          </button>
                        </div>
                      )}
                      <div className="flex flex-col bg-gray-800/60 backdrop-blur-xl p-5 md:p-6 rounded-2xl shadow-sm border border-white/10 w-full max-w-[18rem] md:w-auto mx-auto md:mx-0 shrink-0 hover:border-white/20 transition-colors">
                        <div className="flex justify-between items-center w-full mb-5 border-b border-white/10 pb-4">
                          <div className="flex items-center gap-3">
                            <input type="text" placeholder="k" className="w-12 px-2 py-1.5 border border-white/10 rounded-lg text-center placeholder:text-center outline-none font-bold text-white bg-gray-900/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all" value={mat.scalar} onChange={(e) => updateScalar(mat.id, e.target.value)} />
                            <span className="font-extrabold text-gray-200 tracking-wide">Matrix {matrixNames[i]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => clearMatrix(mat.id)} className="text-xs font-bold text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-600 active:scale-95 transition-all">ล้าง</button>
                            {matrices.length > 1 && (
                              <button type="button" onClick={() => removeMatrix(mat.id)} className="text-xs font-bold text-red-400 hover:text-red-200 px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/60 active:scale-95 border border-red-500/30 transition-all">ลบ</button>
                            )}
                          </div>
                        </div>
                        <div className={`grid gap-3 mx-auto w-fit ${getLinearGridColsClass(linearCols)}`}>
                          {Array.from({ length: linearRows * linearCols }).map((_, i) => {
                            const stateIdx = Math.floor(i / linearCols) * 4 + (i % linearCols);
                            return (
                              <label key={`mat-${mat.id}-${stateIdx}`} className={`relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 border rounded-xl cursor-text transition-all ${isActiveScalar ? 'border-blue-500/50 bg-blue-900/20' : 'border-white/10 bg-gray-900/60 focus-within:border-blue-500/50'}`}>
                                <input type="number" className="w-full h-full text-center placeholder:text-center outline-none bg-transparent text-xl font-bold text-white z-10" value={mat.data[stateIdx]} onChange={(e) => updateMatrixData(mat.id, stateIdx, e.target.value)} placeholder="0" />
                                {isActiveScalar && mat.data[stateIdx] !== '' && (
                                  <div className="absolute top-1 right-1 bg-blue-900 text-blue-300 text-[10px] font-bold px-1 rounded-sm pointer-events-none z-0">{getNum(mat.data[stateIdx], 0) * k}</div>
                                )}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </Fragment>
                  );
                })}
                <div className="flex justify-center items-center shrink-0 px-2">
                  <span className="text-4xl font-black text-gray-500/50 md:px-2">=</span>
                </div>
                <div className="bg-gray-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/10 text-white w-full max-w-[18rem] md:w-auto mx-auto md:mx-0 shrink-0">
                  <p className="text-center mb-5 font-extrabold tracking-widest text-lg border-b border-white/10 pb-4 text-blue-400">RESULT</p>
                  <div className={`grid gap-3 mx-auto w-fit ${getLinearGridColsClass(linearCols)}`}>
                    {Array.from({ length: linearRows * linearCols }).map((_, i) => {
                      const stateIdx = Math.floor(i / linearCols) * 4 + (i % linearCols);
                      return (
                        <div key={`res-${stateIdx}`} className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-gray-900/80 border border-white/5 rounded-xl text-xl font-bold shadow-inner overflow-hidden text-gray-100">
                          {calculateResult(stateIdx)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'multiply' && (
            <div className="w-full max-w-6xl">
              <div className="bg-gray-800/60 backdrop-blur-xl px-5 md:px-6 py-5 rounded-2xl shadow-sm border border-white/10 w-full mb-8 md:mb-10 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between hover:border-white/20 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-5 w-full lg:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                  <span className="font-bold text-gray-300 tracking-wide hidden sm:block shrink-0">กำหนดมิติ:</span>
                  <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="flex flex-1 sm:flex-none items-center justify-between gap-2 bg-gray-900/80 px-3 py-2 rounded-xl border border-white/10 focus-within:border-gray-500 transition-colors shrink-0">
                      <span className="text-sm font-medium text-gray-400">แถว A:</span>
                      <select className="bg-transparent text-white font-bold outline-none cursor-pointer" value={rowA} onChange={e => setRowA(Number(e.target.value))}>{[1, 2, 3, 4].map(n => <option key={n} value={n} className="bg-gray-800">{n}</option>)}</select>
                    </div>
                    <div className="flex flex-1 sm:flex-none items-center justify-between gap-2 bg-blue-900/20 px-3 py-2 rounded-xl border border-blue-500/30 focus-within:border-blue-500/60 transition-colors shrink-0">
                      <span className="text-sm font-medium text-blue-400">หลักA/แถวB:</span>
                      <select className="bg-transparent text-blue-400 font-bold outline-none cursor-pointer" value={colA} onChange={e => setColA(Number(e.target.value))}>{[1, 2, 3, 4].map(n => <option key={n} value={n} className="bg-gray-800">{n}</option>)}</select>
                    </div>
                    <div className="flex flex-1 sm:flex-none items-center justify-between gap-2 bg-gray-900/80 px-3 py-2 rounded-xl border border-white/10 focus-within:border-gray-500 transition-colors shrink-0">
                      <span className="text-sm font-medium text-gray-400">หลัก B:</span>
                      <select className="bg-transparent text-white font-bold outline-none cursor-pointer" value={colB} onChange={e => setColB(Number(e.target.value))}>{[1, 2, 3, 4].map(n => <option key={n} value={n} className="bg-gray-800">{n}</option>)}</select>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={clearMultAll} className="px-5 py-3 sm:py-2.5 text-sm md:text-base bg-red-900/40 text-red-400 font-bold rounded-xl hover:bg-red-800/60 border border-red-500/30 active:scale-95 transition-all w-full lg:w-auto tracking-wide shrink-0">
                  ล้างค่าทั้งหมด
                </button>
              </div>

              <div className="flex flex-col md:flex-row flex-wrap gap-8 items-center justify-center w-full pb-10">
                <div className="flex flex-col bg-gray-800/60 backdrop-blur-xl p-5 md:p-6 rounded-2xl shadow-sm border border-white/10 w-full max-w-[18rem] md:w-auto mx-auto md:mx-0 shrink-0 hover:border-white/20 transition-colors">
                  <div className="flex justify-between items-center w-full mb-5 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <input type="text" placeholder="k" className="w-12 px-2 py-1.5 border border-white/10 rounded-lg text-center placeholder:text-center outline-none font-bold text-white bg-gray-900/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all" value={scalarMultA} onChange={(e) => setScalarMultA(e.target.value)} />
                      <span className="font-extrabold text-gray-200 tracking-wide">Matrix A ({rowA}×{colA})</span>
                    </div>
                  </div>
                  <div className={`grid gap-3 mx-auto w-fit ${getLinearGridColsClass(colA)}`}>
                    {Array.from({ length: rowA * colA }).map((_, i) => {
                      const stateIdx = Math.floor(i / colA) * 4 + (i % colA);
                      const k = getNum(scalarMultA, 1);
                      const isActive = scalarMultA !== '' && scalarMultA !== '1' && scalarMultA !== '-';
                      return (
                        <label key={`A-${stateIdx}`} className={`relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 border rounded-xl cursor-text transition-all ${isActive ? 'border-blue-500/50 bg-blue-900/20' : 'border-white/10 bg-gray-900/60 focus-within:border-blue-500/50'}`}>
                          <input type="number" className="w-full h-full text-center placeholder:text-center outline-none bg-transparent text-xl font-bold text-white z-10" value={matrixMultA[stateIdx]} onChange={(e) => updateMultMatrix('A', stateIdx, e.target.value)} placeholder="0" />
                          {isActive && matrixMultA[stateIdx] !== '' && <div className="absolute top-1 right-1 bg-blue-900 text-blue-300 text-[10px] font-bold px-1 rounded-sm pointer-events-none z-0">{getNum(matrixMultA[stateIdx], 0) * k}</div>}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-center items-center shrink-0 px-2">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </div>
                </div>

                <div className="flex flex-col bg-gray-800/60 backdrop-blur-xl p-5 md:p-6 rounded-2xl shadow-sm border border-white/10 w-full max-w-[18rem] md:w-auto mx-auto md:mx-0 shrink-0 hover:border-white/20 transition-colors">
                  <div className="flex justify-between items-center w-full mb-5 border-b border-white/10 pb-4">
                     <div className="flex items-center gap-3">
                      <input type="text" placeholder="k" className="w-12 px-2 py-1.5 border border-white/10 rounded-lg text-center placeholder:text-center outline-none font-bold text-white bg-gray-900/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all" value={scalarMultB} onChange={(e) => setScalarMultB(e.target.value)} />
                      <span className="font-extrabold text-gray-200 tracking-wide">Matrix B ({colA}×{colB})</span>
                    </div>
                  </div>
                  <div className={`grid gap-3 mx-auto w-fit ${getLinearGridColsClass(colB)}`}>
                    {Array.from({ length: colA * colB }).map((_, i) => {
                      const stateIdx = Math.floor(i / colB) * 4 + (i % colB);
                      const k = getNum(scalarMultB, 1);
                      const isActive = scalarMultB !== '' && scalarMultB !== '1' && scalarMultB !== '-';
                      return (
                        <label key={`B-${stateIdx}`} className={`relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 border rounded-xl cursor-text transition-all ${isActive ? 'border-blue-500/50 bg-blue-900/20' : 'border-white/10 bg-gray-900/60 focus-within:border-blue-500/50'}`}>
                          <input type="number" className="w-full h-full text-center placeholder:text-center outline-none bg-transparent text-xl font-bold text-white z-10" value={matrixMultB[stateIdx]} onChange={(e) => updateMultMatrix('B', stateIdx, e.target.value)} placeholder="0" />
                          {isActive && matrixMultB[stateIdx] !== '' && <div className="absolute top-1 right-1 bg-blue-900 text-blue-300 text-[10px] font-bold px-1 rounded-sm pointer-events-none z-0">{getNum(matrixMultB[stateIdx], 0) * k}</div>}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-center items-center shrink-0 px-2">
                  <span className="text-4xl font-black text-gray-500/50 md:px-2">=</span>
                </div>

                <div className="bg-gray-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/10 text-white w-full max-w-[18rem] md:w-auto mx-auto md:mx-0 flex flex-col items-center shrink-0">
                  <div className="w-full flex justify-between items-center mb-5 border-b border-white/10 pb-4 gap-6">
                    <span className="font-extrabold tracking-widest text-lg text-blue-400">RESULT</span>
                    <button onClick={useResultAsA} className="text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 font-bold px-4 py-2 rounded-lg transition active:scale-95 shadow-sm border border-blue-500/50 tracking-wide">ใช้เป็นตัวตั้ง</button>
                  </div>
                  <div className={`grid gap-3 mx-auto w-fit ${getLinearGridColsClass(colB)}`}>
                    {Array.from({ length: rowA * colB }).map((_, i) => {
                      const r = Math.floor(i / colB);
                      const c = i % colB;
                      const kA = getNum(scalarMultA, 1);
                      const kB = getNum(scalarMultB, 1);
                      let resultSum = 0;
                      for (let k = 0; k < colA; k++) resultSum += (getNum(matrixMultA[r * 4 + k]) * kA) * (getNum(matrixMultB[k * 4 + c]) * kB);
                      return (
                        <div key={`res-${i}`} className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-gray-900/80 border border-white/5 rounded-xl text-xl font-bold shadow-inner overflow-hidden text-gray-100">{resultSum}</div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="w-full max-w-6xl flex flex-col items-center">
              <div className="bg-gray-800/60 backdrop-blur-xl p-5 md:p-6 rounded-2xl shadow-sm border border-white/10 w-full max-w-88 mb-10 flex flex-col mx-auto hover:border-white/20 transition-colors">
                <div className="flex justify-between items-center w-full mb-5 border-b border-white/10 pb-4">
                  <span className="font-extrabold text-gray-100 text-xl tracking-wide">Matrix A</span>
                  <button type="button" onClick={clearAdvMatrix} className="text-xs font-bold text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-600 active:scale-95 transition-all">ล้างค่า</button>
                </div>

                <div className="flex justify-center items-center gap-3 sm:gap-5 mb-8">
                  <div className="flex items-center gap-2 bg-gray-900/80 p-2 rounded-xl border border-white/10">
                    <span className="text-sm font-medium text-gray-400">แถว:</span>
                    <select className="bg-transparent font-bold text-white outline-none cursor-pointer" value={advRows} onChange={e => setAdvRows(Number(e.target.value))}>{[1, 2, 3, 4].map(n => <option className="bg-gray-800" key={n} value={n}>{n}</option>)}</select>
                  </div>
                  <span className="text-gray-600 font-bold">×</span>
                  <div className="flex items-center gap-2 bg-gray-900/80 p-2 rounded-xl border border-white/10">
                    <span className="text-sm font-medium text-gray-400">หลัก:</span>
                    <select className="bg-transparent font-bold text-white outline-none cursor-pointer" value={advCols} onChange={e => setAdvCols(Number(e.target.value))}>{[1, 2, 3, 4].map(n => <option className="bg-gray-800" key={n} value={n}>{n}</option>)}</select>
                  </div>
                </div>

                <div className={`grid gap-3 mx-auto w-fit ${getLinearGridColsClass(advCols)}`}>
                  {Array.from({ length: advRows * advCols }).map((_, i) => {
                    const stateIdx = Math.floor(i / advCols) * 4 + (i % advCols);
                    return (
                      <label key={`adv-${stateIdx}`} className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 border border-white/10 bg-gray-900/60 focus-within:border-blue-500/50 rounded-xl cursor-text transition-all shadow-inner">
                        <input type="number" className="w-full h-full text-center placeholder:text-center outline-none bg-transparent text-2xl font-bold text-white" value={matrixAdv[stateIdx]} onChange={(e) => updateAdvMatrix(stateIdx, e.target.value)} placeholder="0" />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                <div className="bg-gray-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/10 text-white flex flex-col items-center">
                  <p className="text-center font-extrabold tracking-wider text-lg border-b border-white/10 pb-4 w-full mb-5 text-gray-300">Transpose (Aᵀ)</p>
                  <div className={`grid gap-3 mx-auto w-fit ${getLinearGridColsClass(advRows)}`}>
                    {Array.from({ length: advCols * advRows }).map((_, i) => {
                      const r = Math.floor(i / advRows);
                      const c = i % advRows;
                      return (
                        <div key={`trans-${i}`} className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-gray-900/80 border border-white/5 rounded-xl text-xl font-bold shadow-inner overflow-hidden text-gray-100">
                          {adv2D[c][r]}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/10 text-white flex flex-col items-center justify-start">
                  <p className="text-center font-extrabold tracking-wider text-lg border-b border-white/10 pb-4 w-full mb-5 text-gray-300">Determinant det(A)</p>
                  <div className="flex-1 flex items-center justify-center w-full min-h-24">
                    {isSquare ? (
                      <span className="text-6xl font-black text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        {formatRes(advDet as number)}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-red-400 bg-red-900/30 border border-red-500/30 px-5 py-2.5 rounded-xl text-center tracking-wide">
                        ต้องเป็นตารางจัตุรัสเท่านั้น
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/10 text-white flex flex-col items-center">
                  <p className="text-center font-extrabold tracking-wider text-lg border-b border-white/10 pb-4 w-full mb-5 text-gray-300">Inverse (A⁻¹)</p>
                  {!isSquare ? (
                     <div className="flex-1 flex items-center justify-center w-full min-h-24">
                       <span className="text-sm font-bold text-red-400 bg-red-900/30 border border-red-500/30 px-5 py-2.5 rounded-xl text-center tracking-wide">
                         ต้องเป็นตารางจัตุรัสเท่านั้น
                       </span>
                     </div>
                  ) : advDet === 0 ? (
                    <div className="flex-1 flex items-center justify-center w-full min-h-24">
                       <span className="text-sm font-bold text-red-400 bg-red-900/30 border border-red-500/30 px-5 py-2.5 rounded-xl text-center tracking-wide">
                         หาไม่ได้ (ค่า det = 0)
                       </span>
                     </div>
                  ) : (
                    <div className={`grid gap-3 mx-auto w-fit ${getLinearGridColsClass(advCols)}`}>
                      {advInv?.map((row, r) => row.map((val, c) => (
                        <div key={`inv-${r}-${c}`} className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-gray-900/80 border border-white/5 rounded-xl text-sm md:text-base font-bold text-blue-400 shadow-inner overflow-hidden">
                          {formatRes(val)}
                        </div>
                      )))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}