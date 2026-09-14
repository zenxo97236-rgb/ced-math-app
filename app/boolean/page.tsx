'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

// --- Types & Data Models ---
type LogicMode = 'SOP' | 'POS';
type CircuitMode = 'FULL' | 'MINIMIZED';

interface CircuitTerm {
  piStr: string;
  indices: number[];
  equationStr: string;
}

interface CircuitData {
  mode: LogicMode;
  vars: string[];
  terms: CircuitTerm[];
}

// --- Helper: Insert text at cursor ---
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

const KeyboardPanel = ({ setter, inputRef }: { setter: React.Dispatch<React.SetStateAction<string>>, inputRef: React.RefObject<HTMLInputElement | null> }) => (
  // 🟢 แก้ไขข้อ 2 & Glassmorphism: เอาคำว่า "แผงปุ่มกดด่วน" ออก และใช้ backdrop-blur
  <div className="flex flex-col gap-3 mb-5 bg-gray-900/60 backdrop-blur-xl p-4 rounded-xl border border-white/10 w-full shadow-lg">
    <div className="flex flex-wrap items-center gap-2">
      {['A', 'B', 'C', 'D'].map(v => (
        <button key={v} onClick={() => insertAtCursor(v, setter, inputRef)} className="px-3 py-1.5 bg-indigo-900/40 hover:bg-indigo-600 active:scale-95 border border-indigo-500/30 rounded-lg text-indigo-300 hover:text-white font-bold text-sm transition-all shadow-sm">{v}</button>
      ))}
      <div className="w-px h-6 bg-white/10 mx-1"></div>
      <button onClick={() => insertAtCursor("'", setter, inputRef)} className="px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700 active:scale-95 border border-white/10 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">NOT (&apos;)</button>
      <button onClick={() => insertAtCursor(' * ', setter, inputRef)} className="px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700 active:scale-95 border border-white/10 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">AND (*)</button>
      <button onClick={() => insertAtCursor(' + ', setter, inputRef)} className="px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700 active:scale-95 border border-white/10 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">OR (+)</button>
      <button onClick={() => insertAtCursor(' ⊕ ', setter, inputRef)} className="px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700 active:scale-95 border border-white/10 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">XOR (⊕)</button>
      <button onClick={() => insertAtCursor('()', setter, inputRef)} className="px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700 active:scale-95 border border-white/10 rounded-lg text-gray-200 font-bold text-sm transition-all shadow-sm">( )</button>
      <button onClick={() => setter('')} className="px-3 py-1.5 bg-red-900/40 hover:bg-red-800/60 active:scale-95 border border-red-500/30 text-red-400 rounded-lg font-bold text-sm transition-all shadow-sm ml-auto">ล้าง</button>
    </div>
  </div>
);

// --- Boolean Minimization Engine (Exact Cover) ---
const getIndicesFromPI = (pi: string) => {
    let results = [''];
    for(const char of pi) {
        if(char === '-') {
            const temp: string[] = [];
            for(const r of results) { temp.push(r+'0'); temp.push(r+'1'); }
            results = temp;
        } else {
            for(let i=0; i<results.length; i++) results[i] += char;
        }
    }
    return results.map(bin => parseInt(bin, 2));
};

const getExactMinimumCover = (pis: string[], targets: number[]): string[] => {
    if (targets.length === 0) return [];
    let best: string[] = [];
    let minCost = Infinity;
    const targetSet = new Set(targets);

    const covers = pis.map(pi => getIndicesFromPI(pi).filter(idx => targetSet.has(idx)));
    const essentialPIs: string[] = [];
    const uncoveredTargets = new Set(targets);

    targets.forEach(t => {
        const coveringPIs = pis.filter((_, i) => covers[i].includes(t));
        if (coveringPIs.length === 1) {
            if (!essentialPIs.includes(coveringPIs[0])) {
                essentialPIs.push(coveringPIs[0]);
                covers[pis.indexOf(coveringPIs[0])].forEach(coveredT => uncoveredTargets.delete(coveredT));
            }
        }
    });

    const remainingTargets = Array.from(uncoveredTargets);
    const remainingPIs = pis.filter(pi => !essentialPIs.includes(pi));
    const remainingCovers = remainingPIs.map(pi => covers[pis.indexOf(pi)].filter(t => uncoveredTargets.has(t)));

    const search = (targetIdx: number, currentSelection: string[]) => {
        if (targetIdx >= remainingTargets.length) {
            const totalSelection = [...essentialPIs, ...currentSelection];
            const cost = totalSelection.length * 1000 + totalSelection.reduce((sum, pi) => sum + pi.replace(/-/g, '').length, 0);
            if (cost < minCost) {
                minCost = cost;
                best = [...currentSelection];
            }
            return;
        }

        const t = remainingTargets[targetIdx];
        const isCovered = currentSelection.some(pi => remainingCovers[remainingPIs.indexOf(pi)].includes(t));
        
        if (isCovered) {
            search(targetIdx + 1, currentSelection);
            return;
        }

        let branchFound = false;
        for (let i = 0; i < remainingPIs.length; i++) {
            if (remainingCovers[i].includes(t)) {
                branchFound = true;
                currentSelection.push(remainingPIs[i]);
                const tempTotal = [...essentialPIs, ...currentSelection];
                const tempCost = tempTotal.length * 1000 + tempTotal.reduce((sum, pi) => sum + pi.replace(/-/g, '').length, 0);
                if (tempCost < minCost) {
                    search(targetIdx + 1, currentSelection);
                }
                currentSelection.pop();
            }
        }
        if (!branchFound) return;
    };

    if (remainingTargets.length === 0) return essentialPIs.sort((a, b) => (b.match(/-/g) || []).length - (a.match(/-/g) || []).length);
    search(0, []);
    const finalSelection = [...essentialPIs, ...best];
    return finalSelection.sort((a, b) => (b.match(/-/g) || []).length - (a.match(/-/g) || []).length);
};

const getPrimeImplicants = (targetIndices: number[], numVars: number) => {
  if (targetIndices.length === 0) return [];
  if (targetIndices.length === Math.pow(2, numVars)) return ['-'.repeat(numVars)];

  const terms = targetIndices.map(m => m.toString(2).padStart(numVars, '0'));
  const primeImplicants: string[] = [];

  let current = terms;
  while (current.length > 0) {
    const next: string[] = [];
    const used = new Array(current.length).fill(false);
    
    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        let diff = 0, idx = -1;
        for (let k = 0; k < numVars; k++) {
          if (current[i][k] !== current[j][k]) { diff++; idx = k; }
        }
        if (diff === 1) {
          used[i] = true; used[j] = true;
          const combined = current[i].substring(0, idx) + '-' + current[i].substring(idx + 1);
          if (!next.includes(combined)) next.push(combined);
        }
      }
    }
    
    for (let i = 0; i < current.length; i++) {
      if (!used[i] && !primeImplicants.includes(current[i])) primeImplicants.push(current[i]);
    }
    current = next;
  }

  return getExactMinimumCover(primeImplicants, targetIndices);
};

const getEquationFromPI = (pi: string, vars: string[], mode: LogicMode) => {
    const terms: string[] = [];
    for(let i=0; i<pi.length; i++) {
        if(pi[i] !== '-') {
            if (mode === 'SOP') {
                if (pi[i] === '1') terms.push(vars[i]);
                else if (pi[i] === '0') terms.push(vars[i] + "'");
            } else {
                if (pi[i] === '0') terms.push(vars[i]);
                else if (pi[i] === '1') terms.push(vars[i] + "'");
            }
        }
    }
    if (terms.length === 0) return mode === 'SOP' ? '1' : '0';
    if (mode === 'SOP') return terms.join('');
    return `(${terms.join(' + ')})`;
};

const buildFinalEquation = (circuitData: CircuitData) => {
    if (circuitData.terms.length === 0) return circuitData.mode === 'SOP' ? '0' : '1';
    if (circuitData.terms[0].piStr === '-'.repeat(circuitData.vars.length)) return circuitData.mode === 'SOP' ? '1' : '0';
    const eqs = circuitData.terms.map(t => t.equationStr);
    return circuitData.mode === 'SOP' ? eqs.join(' + ') : eqs.join('');
};

const groupColors = [
    { bg: 'bg-red-500', bgLight: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', name: 'สีแดง' },
    { bg: 'bg-blue-500', bgLight: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', name: 'สีฟ้า' },
    { bg: 'bg-green-500', bgLight: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', name: 'สีเขียว' },
    { bg: 'bg-yellow-500', bgLight: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', name: 'สีเหลือง' },
    { bg: 'bg-pink-500', bgLight: 'bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-400', name: 'สีชมพู' },
    { bg: 'bg-cyan-500', bgLight: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-400', name: 'สีฟ้าอ่อน' },
];

// --- Universal Circuit Renderer (SOP & POS Support) ---
const BusStyleCircuitRenderer = ({ 
  circuitData, 
  activeTermIdx,
  onTermClick 
}: { 
  circuitData: CircuitData, 
  activeTermIdx: number | null,
  onTermClick: (index: number | null) => void 
}) => {
  const { mode, vars, terms } = circuitData;

  if (terms.length === 0) return <div className="text-gray-400 py-10 font-bold text-center">วงจรนี้ให้ค่าเป็น {mode === 'SOP' ? '0' : '1'} เสมอ (ไม่มีเส้นทางไฟ)</div>;
  if (terms[0].piStr === '-'.repeat(vars.length)) return <div className="text-emerald-400 py-10 font-bold text-center">วงจรนี้ให้ค่าเป็น {mode === 'SOP' ? '1' : '0'} เสมอ (ต่อไฟตรง)</div>;

  const startX = 60;
  const varSpacing = 60;
  const startY = 80;
  const rowSpacing = 70;
  const gateX = startX + vars.length * varSpacing + 40;
  const outputX = gateX + 160;
  const height = Math.max(startY + terms.length * rowSpacing + 40, 300);
  const busHeight = height - 40;
  const centerY = startY + ((terms.length - 1) * rowSpacing) / 2;
  const width = outputX + 100;

  const getVarX = (vIndex: number) => startX + vIndex * varSpacing;
  const getInvX = (vIndex: number) => getVarX(vIndex) + 20;

  const renderNOT = (x: number, y: number) => (
     <g transform={`translate(${x}, ${y}) scale(0.8)`}>
        <polygon points="-15,-10 15,-10 0,15" fill="#1f2937" stroke="#fca5a5" strokeWidth="2.5" />
        <circle cx="0" cy="20" r="4" fill="#1f2937" stroke="#fca5a5" strokeWidth="2.5"/>
     </g>
  );

  const renderAND = (x: number, y: number, isHighlighted: boolean, scale: number = 1) => (
     <g transform={`translate(${x}, ${y}) scale(${scale})`} className="transition-all duration-300 pointer-events-none">
        <path d="M 0 -20 L 15 -20 A 20 20 0 0 1 35 0 A 20 20 0 0 1 15 20 L 0 20 Z" fill={isHighlighted ? "#6b21a8" : "#1f2937"} stroke={isHighlighted ? "#e9d5ff" : "#d8b4fe"} strokeWidth={2.5 / scale} />
     </g>
  );

  const renderOR = (x: number, y: number, isHighlighted: boolean, scale: number = 1) => (
     <g transform={`translate(${x}, ${y}) scale(${scale})`} className="transition-all duration-300 pointer-events-none">
        <path d="M 0 -20 Q 15 0 0 20 Q 25 20 35 0 Q 25 -20 0 -20 Z" fill={isHighlighted ? "#1e3a8a" : "#1f2937"} stroke={isHighlighted ? "#bfdbfe" : "#93c5fd"} strokeWidth={2.5 / scale} />
     </g>
  );

  const FirstLayerGate = mode === 'SOP' ? renderAND : renderOR;
  const FinalLayerGate = mode === 'SOP' ? renderOR : renderAND;

  return (
    <div className="w-full overflow-x-auto bg-gray-900/60 backdrop-blur-md p-6 rounded-xl custom-scrollbar flex justify-center border border-white/10">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: width, height }} className="drop-shadow-2xl select-none">
        
        {vars.map((v, i) => {
          let isVarActive = false;
          let isInvActive = false;
          if (activeTermIdx !== null && terms[activeTermIdx]) {
              const char = terms[activeTermIdx].piStr[i];
              if (char !== '-') {
                  const isNormal = mode === 'SOP' ? char === '1' : char === '0';
                  if (isNormal) isVarActive = true; else isInvActive = true;
              }
          }
          const dimOpacity = activeTermIdx !== null ? 0.3 : 1;

          return (
            <g key={`bus-${i}`}>
              <text x={getVarX(i)} y="30" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{v}</text>
              <line x1={getVarX(i)} y1="40" x2={getVarX(i)} y2={busHeight} stroke={isVarActive ? "#e9d5ff" : "#4b5563"} strokeWidth={isVarActive ? 3.5 : 2.5} style={{ opacity: isVarActive ? 1 : dimOpacity, transition: 'all 0.3s' }} />
              <circle cx={getVarX(i)} cy="50" r="4" fill="#fca5a5" style={{ opacity: dimOpacity }}/>
              <line x1={getVarX(i)} y1="50" x2={getInvX(i)} y2="50" stroke="#fca5a5" strokeWidth="2" style={{ opacity: dimOpacity }} />
              {renderNOT(getInvX(i), 60)}
              <line x1={getInvX(i)} y1="80" x2={getInvX(i)} y2={busHeight} stroke={isInvActive ? "#fca5a5" : "#4b5563"} strokeWidth={isInvActive ? 3.5 : 2.5} strokeDasharray={isInvActive ? "none" : "4 2"} style={{ opacity: isInvActive ? 1 : dimOpacity, transition: 'all 0.3s' }} />
            </g>
          );
        })}

        {terms.map((term, tIndex) => {
           const rowY = startY + 40 + tIndex * rowSpacing;
           const isHighlighted = activeTermIdx === tIndex;
           const isDimmed = activeTermIdx !== null && activeTermIdx !== tIndex;
           
           const firstVarIdx = term.piStr.split('').findIndex(c => c !== '-');
           let startLineX = getVarX(0);
           if (firstVarIdx !== -1) {
               const char = term.piStr[firstVarIdx];
               const isNormal = mode === 'SOP' ? char === '1' : char === '0';
               startLineX = isNormal ? getVarX(firstVarIdx) : getInvX(firstVarIdx);
           }

           return (
             <g key={`term-${tIndex}`} 
                className="cursor-pointer transition-opacity duration-300 group" 
                style={{ opacity: isDimmed ? 0.2 : 1 }} 
                onClick={() => onTermClick(isHighlighted ? null : tIndex)}
             >
                <rect x={startX - 10} y={rowY - 30} width={outputX - startX} height={60} fill="transparent" />

                <line x1={startLineX} y1={rowY} x2={gateX} y2={rowY} stroke={isHighlighted ? "#e9d5ff" : "#6b7280"} strokeWidth={isHighlighted ? "3.5" : "2.5"} className="group-hover:stroke-purple-300 transition-colors" />
                {term.piStr.split('').map((char, vIndex) => {
                   if (char === '-') return null;
                   const isNormal = mode === 'SOP' ? char === '1' : char === '0';
                   const cx = isNormal ? getVarX(vIndex) : getInvX(vIndex);
                   return <circle key={`tap-${tIndex}-${vIndex}`} cx={cx} cy={rowY} r="5.5" fill={isHighlighted ? "#d8b4fe" : "#9ca3af"} className="group-hover:fill-purple-300 transition-colors pointer-events-none" />;
                })}

                {FirstLayerGate(gateX, rowY, isHighlighted, 1)}

                <text x={gateX + 45} y={rowY - 10} fill={isHighlighted ? "#e9d5ff" : "#9ca3af"} fontSize="12" fontWeight="bold" className="font-mono group-hover:fill-purple-300 transition-colors pointer-events-none">
                   {term.equationStr}
                </text>

                <path d={`M ${gateX + 35} ${rowY} C ${outputX - 40} ${rowY}, ${outputX - 40} ${centerY}, ${outputX - 10} ${centerY}`} 
                      fill="none" stroke={isHighlighted ? "#bfdbfe" : "#6b7280"} strokeWidth={isHighlighted ? "3.5" : "2.5"} className="group-hover:stroke-blue-300 transition-colors pointer-events-none" />
             </g>
           );
        })}

        <g style={{ opacity: activeTermIdx !== null ? 0.8 : 1 }} className="pointer-events-none">
          {FinalLayerGate(outputX - 10, centerY, activeTermIdx !== null, 1.5)}
          <line x1={outputX + 45} y1={centerY} x2={outputX + 80} y2={centerY} stroke="#60a5fa" strokeWidth="3" />
          <circle cx={outputX + 80} cy={centerY} r="5" fill="#60a5fa" />
          <text x={outputX + 80} y={centerY - 10} fill="white" fontSize="18" fontWeight="bold">Y</text>
        </g>
      </svg>
    </div>
  );
};

// --- Main Component ---
export default function BooleanApp() {
  const [activeTab, setActiveTab] = useState<'sop_pos' | 'kmap' | 'circuit'>('sop_pos');
  const [kmapMode, setKmapMode] = useState<LogicMode>('SOP');
  const [circuitMode, setCircuitMode] = useState<CircuitMode>('FULL');
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'sop_pos' || tab === 'kmap' || tab === 'circuit') {
        setTimeout(() => setActiveTab(tab as 'sop_pos' | 'kmap' | 'circuit'), 0);
      }
    }
  }, []);

  // 🟢 แก้ไข: Smooth Layout Transition แบบ Fade in/out
  const handleTabChange = (tab: 'sop_pos' | 'kmap' | 'circuit') => {
    if (activeTab === tab) return;
    setIsTransitioning(true);
    setTimeout(() => setActiveGroupIndex(null), 0);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
      if (typeof window !== 'undefined') window.history.replaceState(null, '', `?tab=${tab}`);
    }, 300); // หน่วงเวลาให้ Fade out เสร็จก่อนเปลี่ยน
    setIsMobileMenuOpen(false);
  };

  const [expression, setExpression] = useState("A'B + AB'");
  const inputRefAlg = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => setActiveGroupIndex(null), 0);
  }, [expression, kmapMode, circuitMode]);

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
        rowVals[vari] = (i >> (vars.length - 1 - idx)) & 1;
      });
      r.push({ values: rowVals, decimal: i });
    }
    return r;
  };

  const evaluateBoolean = (exprStr: string, rowVals: Record<string, number>) => {
    if (!exprStr.trim()) return null;
    try {
      let expr = exprStr.toUpperCase();
      expr = expr.replace(/⊕/g, ' !== '); 
      expr = expr.replace(/\+/g, ' || '); 
      expr = expr.replace(/\*/g, ' && '); 
      expr = expr.replace(/!/g, ' ! ');   
      expr = expr.replace(/([A-Z])'/g, "!$1");
      expr = expr.replace(/([A-Z])\s*(?=[A-Z!])/g, "$1 && ");
      expr = expr.replace(/([A-Z])\s*(?=[A-Z!])/g, "$1 && "); 
      expr = expr.replace(/([A-Z])\s*(?=\()/g, "$1 && ");     
      expr = expr.replace(/\)\s*(?=[A-Z!])/g, ") && ");       
      
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

  const vars = getVariables(expression);
  const rows = generateRows(vars);
  const isValid = rows.length > 0 && evaluateBoolean(expression, rows[0].values) !== null;

  const sopRows = isValid ? rows.filter(r => evaluateBoolean(expression, r.values) === 1) : [];
  const posRows = isValid ? rows.filter(r => evaluateBoolean(expression, r.values) === 0) : [];

  const getSOPTerm = (rowVals: Record<string, number>) => Object.entries(rowVals).map(([key, val]) => (val === 1 ? key : `${key}'`)).join('');
  const getPOSTerm = (rowVals: Record<string, number>) => `(${Object.entries(rowVals).map(([key, val]) => (val === 0 ? key : `${key}'`)).join(' + ')})`;

  const getKMapConfig = (variables: string[]) => {
    const count = variables.length;
    if (count === 2) return { rowLabel: variables[0], colLabel: variables[1], rowGray: ['0', '1'], colGray: ['0', '1'], getIndex: (r: string, c: string) => parseInt(r + c, 2) };
    if (count === 3) return { rowLabel: variables[0], colLabel: `${variables[1]}${variables[2]}`, rowGray: ['0', '1'], colGray: ['00', '01', '11', '10'], getIndex: (r: string, c: string) => parseInt(r + c, 2) };
    if (count === 4) return { rowLabel: `${variables[0]}${variables[1]}`, colLabel: `${variables[2]}${variables[3]}`, rowGray: ['00', '01', '11', '10'], colGray: ['00', '01', '11', '10'], getIndex: (r: string, c: string) => parseInt(r + c, 2) };
    return null;
  };

  const getCellValue = (decimalIndex: number) => {
    const row = rows.find(r => r.decimal === decimalIndex);
    if (!row) return 0;
    return evaluateBoolean(expression, row.values);
  };

  const targetIndices = kmapMode === 'SOP' ? sopRows.map(r => r.decimal) : posRows.map(r => r.decimal);
  const kmapGroupStrs = vars.length >= 2 && vars.length <= 4 && isValid ? getPrimeImplicants(targetIndices, vars.length) : [];
  
  const minimizedCircuitData: CircuitData = {
      mode: kmapMode,
      vars: vars,
      terms: kmapGroupStrs.map(pi => ({ piStr: pi, indices: getIndicesFromPI(pi), equationStr: getEquationFromPI(pi, vars, kmapMode) }))
  };

  const fullCircuitData: CircuitData = {
      mode: kmapMode,
      vars: vars,
      terms: kmapMode === 'SOP' 
          ? sopRows.map(r => { const pi = vars.map(v => r.values[v].toString()).join(''); return { piStr: pi, indices: [r.decimal], equationStr: getEquationFromPI(pi, vars, 'SOP') }; })
          : posRows.map(r => { const pi = vars.map(v => r.values[v].toString()).join(''); return { piStr: pi, indices: [r.decimal], equationStr: getEquationFromPI(pi, vars, 'POS') }; })
  };

  const finalEquationStr = isValid ? buildFinalEquation(minimizedCircuitData) : '';
  const currentCircuitData = circuitMode === 'FULL' ? fullCircuitData : minimizedCircuitData;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 text-gray-100 font-sans selection:bg-purple-500/30">
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #111827; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}} />

      {/* 🟢 แก้ไข: Mobile Drawer Overlay */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}></div>

      {/* 🟢 แก้ไข: Sidebar with Glassmorphism and Mobile Drawer Transform */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-gray-900/80 backdrop-blur-xl border-r border-white/10 flex flex-col shrink-0 z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-5 flex items-center justify-between shrink-0 border-b border-white/10">
          <Link href="/" className="group flex items-center gap-3 text-lg font-extrabold text-white hover:text-gray-300 transition-colors">
            {/* 🟢 แก้ไขข้อ 4: เปลี่ยนไอคอน Home และคำว่า Home */}
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
          <Link href="/converter" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">Number System</Link>
          <Link href="/boolean" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-purple-600/90 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-500/50 transition-all">Boolean</Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar relative">
        
        {/* 🟢 แก้ไข: Mobile Header (Drawer Trigger) */}
        <div className="md:hidden flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
          <span className="font-extrabold text-white text-lg">พีชคณิตบูลีน</span>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-400 hover:text-white">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        <div className="hidden md:block bg-gray-900/80 backdrop-blur-xl border-b border-white/10 pt-6 md:pt-10 px-4 md:px-10 sticky top-0 z-20 shadow-sm">
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-wide mb-6">พีชคณิตบูลีน (Boolean)</h1>
          <div className="flex gap-6 overflow-x-auto custom-scrollbar">
            <button onClick={() => handleTabChange('sop_pos')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'sop_pos' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>SOP และ POS</button>
            <button onClick={() => handleTabChange('kmap')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'kmap' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>แผนผังคาร์โนห์ (K-Map)</button>
            <button onClick={() => handleTabChange('circuit')} className={`pb-4 text-sm md:text-base font-bold whitespace-nowrap border-b-4 transition-colors ${activeTab === 'circuit' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>วงจรลอจิก (Logic Circuit)</button>
          </div>
        </div>

        {/* 🟢 แก้ไข: Smooth Layout Transitions (Opacity transition instead of sliding) */}
        <div key={activeTab} className={`p-4 md:p-10 flex flex-col items-center w-full transition-all duration-300 ease-in-out transform ${isTransitioning ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>
          
          <div className="w-full max-w-5xl flex flex-col items-center mb-10">
            {/* 🟢 แก้ไข: Glassmorphism Cards */}
            <div className="bg-gray-800/60 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-lg border border-white/10 w-full hover:border-white/20 transition-colors">
              <label className="block text-gray-300 font-bold mb-4 text-lg tracking-wide">รูปแบบสมการบูลีน (ป้อนเพื่อวิเคราะห์):</label>
              <KeyboardPanel setter={setExpression} inputRef={inputRefAlg} />
              <input ref={inputRefAlg} type="text" value={expression} onChange={(e) => setExpression(e.target.value)} placeholder="เช่น A'B + AB' หรือพิมพ์ A NOT B" className={`w-full p-4 border-2 bg-gray-900/80 text-white font-bold text-xl md:text-2xl tracking-widest uppercase ${isValid ? 'border-gray-600 focus:border-purple-500' : 'border-red-500/50 focus:border-red-500'} rounded-xl outline-none transition-all shadow-inner`} />
              <div className="flex justify-between items-center mt-3">
                  {!isValid && expression.trim() !== '' ? <p className="text-red-400 text-sm font-medium">สมการไม่สมบูรณ์ โปรดตรวจสอบวงเล็บหรือเครื่องหมาย</p> : <p className="text-emerald-400 text-sm font-medium">✔ สมการถูกต้องและพร้อมประมวลผล</p>}
                  <span className="text-xs text-gray-500">รองรับการพิมพ์ติดกัน (AB) และ (&apos;)</span>
              </div>
            </div>
          </div>

          {activeTab === 'sop_pos' && isValid && (
             <div className="w-full max-w-5xl flex flex-col gap-8">
              <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 w-full overflow-hidden">
                <div className="p-5 border-b border-white/10 bg-gray-900/80"><h3 className="text-lg font-bold text-gray-200">ตารางค่าความจริง (Truth Table)</h3></div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="bg-gray-900/50 border-b border-gray-800">
                        <th className="p-4 text-gray-600 font-bold text-sm w-16 border-r border-gray-800">m</th>
                        {vars.map(v => <th key={`th-${v}`} className="p-4 text-gray-400 font-bold text-lg w-20">{v}</th>)}
                        <th className="p-4 text-purple-400 font-extrabold text-lg border-l border-gray-800">OUTPUT (Y)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {rows.map((row, i) => {
                        const result = evaluateBoolean(expression, row.values);
                        return (
                          <tr key={`row-${i}`} className={`transition-colors ${result === 1 ? 'bg-purple-900/10' : ''} hover:bg-gray-800/30`}>
                            <td className="p-3 border-r border-gray-800 text-gray-600 font-mono text-sm">{row.decimal}</td>
                            {vars.map(v => <td key={`td-${i}-${v}`} className="p-3"><span className={`inline-block w-8 h-8 leading-8 text-center rounded-lg font-medium ${row.values[v] === 1 ? 'text-purple-400' : 'text-gray-500'}`}>{row.values[v]}</span></td>)}
                            <td className="p-3 border-l border-gray-800"><span className={`inline-block px-6 py-2 rounded-lg font-bold shadow-sm border ${result === 1 ? 'bg-purple-600/80 text-white border-purple-500' : 'bg-gray-800/80 text-gray-500 border-gray-700'}`}>{result !== null ? result : '-'}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-lg border border-purple-500/30 w-full overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-white/10 bg-gray-900/80 flex justify-between items-center">
                    <h3 className="text-lg font-black text-purple-400 tracking-wide">SOP (Sum of Products)</h3>
                    <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded-md font-bold border border-purple-500/20">โฟกัส Y = 1</span>
                  </div>
                  <div className="p-6 flex flex-col gap-5 flex-1">
                    <div className="flex flex-col gap-2 flex-1">
                      <span className="text-sm font-bold text-gray-400 border-b border-gray-700 pb-2 mb-2">พจน์ Minterm ที่ได้จากตาราง:</span>
                      {sopRows.length > 0 ? sopRows.map((row, i) => (
                          <div key={`sop-${i}`} className="text-sm bg-gray-900/60 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/5 flex items-center justify-between">
                            <span className="text-gray-500 font-mono">m{row.decimal}</span>
                            <span className="font-mono text-purple-400 font-bold text-lg tracking-widest">{getSOPTerm(row.values)}</span>
                          </div>
                      )) : <div className="text-sm text-gray-500 text-center py-4">ไม่มีแถวที่ Y = 1</div>}
                    </div>
                    <div className="mt-2 pt-5 border-t border-gray-700 flex flex-col gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Minterms Notation</p>
                        <p className="font-mono text-xl font-black text-purple-300 break-all">Y = Σm({sopRows.map(r => r.decimal).join(', ')})</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">SOP Equation</p>
                        <p className="font-mono text-xl font-black text-white leading-relaxed break-all">Y = {sopRows.map(r => getSOPTerm(r.values)).join(' + ') || '0'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-lg border border-blue-500/30 w-full overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-white/10 bg-gray-900/80 flex justify-between items-center">
                    <h3 className="text-lg font-black text-blue-400 tracking-wide">POS (Product of Sums)</h3>
                    <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-md font-bold border border-blue-500/20">โฟกัส Y = 0</span>
                  </div>
                  <div className="p-6 flex flex-col gap-5 flex-1">
                    <div className="flex flex-col gap-2 flex-1">
                      <span className="text-sm font-bold text-gray-400 border-b border-gray-700 pb-2 mb-2">พจน์ Maxterm ที่ได้จากตาราง:</span>
                      {posRows.length > 0 ? posRows.map((row, i) => (
                          <div key={`pos-${i}`} className="text-sm bg-gray-900/60 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/5 flex items-center justify-between">
                            <span className="text-gray-500 font-mono">M{row.decimal}</span>
                            <span className="font-mono text-blue-400 font-bold text-lg tracking-widest">{getPOSTerm(row.values)}</span>
                          </div>
                      )) : <div className="text-sm text-gray-500 text-center py-4">ไม่มีแถวที่ Y = 0</div>}
                    </div>
                    <div className="mt-2 pt-5 border-t border-gray-700 flex flex-col gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Maxterms Notation</p>
                        <p className="font-mono text-xl font-black text-blue-300 break-all">Y = ΠM({posRows.map(r => r.decimal).join(', ')})</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">POS Equation</p>
                        <p className="font-mono text-xl font-black text-white leading-relaxed break-all">Y = {posRows.map(r => getPOSTerm(r.values)).join('') || '1'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kmap' && isValid && (
            <div className="w-full max-w-5xl flex flex-col items-center">
              {vars.length >= 2 && vars.length <= 4 ? (
                <div className="w-full flex flex-col xl:flex-row gap-8 items-start">
                  <div className={`bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-lg border w-full xl:w-7/12 overflow-hidden flex flex-col transition-colors ${kmapMode === 'SOP' ? 'border-purple-500/30' : 'border-blue-500/30'}`}>
                    <div className="p-5 border-b border-white/10 bg-gray-900/80 flex flex-col md:flex-row justify-between items-center gap-4">
                      <h3 className={`text-xl font-black tracking-wide ${kmapMode === 'SOP' ? 'text-purple-400' : 'text-blue-400'}`}>แผนผังคาร์โนห์ (K-Map)</h3>
                      <div className="flex bg-gray-950/80 p-1 rounded-lg border border-white/10">
                        <button onClick={() => setKmapMode('SOP')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${kmapMode === 'SOP' ? 'bg-purple-600/90 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>SOP (วงเลข 1)</button>
                        <button onClick={() => setKmapMode('POS')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${kmapMode === 'POS' ? 'bg-blue-600/90 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>POS (วงเลข 0)</button>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 flex flex-col items-center overflow-x-auto custom-scrollbar w-full relative">
                      {activeGroupIndex !== null && (
                        <div className="absolute top-4 left-0 w-full flex justify-center z-10 animate-pulse">
                          <span className="bg-gray-800/90 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-bold shadow-[0_0_10px_rgba(255,255,255,0.2)] border border-white/20">กำลังไฮไลต์กลุ่มที่ {activeGroupIndex + 1} (คลิกอีกครั้งเพื่อยกเลิก)</span>
                        </div>
                      )}

                      {(() => {
                        const config = getKMapConfig(vars);
                        if (!config) return null;
                        return (
                          <div className="relative inline-block text-center mt-6">
                            <div className="flex justify-start mb-3 ml-2"><span className="text-lg font-black text-gray-400 tracking-widest bg-gray-900/80 px-4 py-2 rounded-xl border border-white/10">{config.rowLabel} \ {config.colLabel}</span></div>
                            <table className="border-collapse border-4 border-gray-700 bg-gray-950 shadow-2xl rounded-lg overflow-hidden">
                              <thead>
                                <tr>
                                  <th className="bg-gray-900/90 p-3"></th>
                                  {config.colGray.map(c => <th key={`col-${c}`} className="border-2 border-gray-700 bg-gray-800/80 p-4 text-xl font-black text-gray-300">{c}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {config.rowGray.map(r => (
                                  <tr key={`row-${r}`}>
                                    <th className="border-2 border-gray-700 bg-gray-800/80 p-4 text-xl font-black text-gray-300">{r}</th>
                                    {config.colGray.map(c => {
                                      const dec = config.getIndex(r, c);
                                      const val = getCellValue(dec);
                                      const isTarget = kmapMode === 'SOP' ? val === 1 : val === 0;
                                      const isCellInActiveGroup = activeGroupIndex !== null ? minimizedCircuitData.terms[activeGroupIndex].indices.includes(dec) : false;
                                      const cellOpacity = activeGroupIndex !== null ? (isCellInActiveGroup ? 'opacity-100 scale-105 z-10 relative bg-gray-800 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]' : 'opacity-20') : 'opacity-100';

                                      return (
                                        <td key={`cell-${r}-${c}`} className={`border-2 border-gray-700 p-4 md:p-6 relative w-20 h-20 md:w-28 md:h-28 bg-gray-900 transition-all duration-300 ${cellOpacity}`}>
                                           <span className="absolute top-1 left-2 text-xs font-mono text-gray-500 font-bold">m{dec}</span>
                                           <span className={`text-4xl md:text-5xl font-black transition-colors ${isTarget ? 'text-white drop-shadow-md' : 'text-gray-600 opacity-30'}`}>{val}</span>
                                           <div className="absolute bottom-2 right-2 flex gap-1 flex-wrap justify-end max-w-[80%]">
                                              {minimizedCircuitData.terms.map((term, idx) => {
                                                  if (term.indices.includes(dec)) {
                                                      const color = groupColors[idx % groupColors.length];
                                                      if (activeGroupIndex !== null && activeGroupIndex !== idx) return null;
                                                      return <div key={idx} className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${color.bg} shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all`} title={`อยู่ในกลุ่ม ${color.name}`}></div>
                                                  }
                                                  return null;
                                              })}
                                           </div>
                                        </td>
                                      )
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 w-full xl:w-5/12">
                    <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 w-full overflow-hidden flex flex-col">
                      <div className="p-5 border-b border-white/10 bg-gray-900/80 flex justify-between items-center">
                         <h3 className="text-xl font-black text-gray-200 tracking-wide">ขั้นตอนการจัดกลุ่ม</h3>
                         <span className="text-xs text-gray-400">คลิกที่การ์ดเพื่อไฮไลต์วง</span>
                      </div>
                      <div className="p-5 flex flex-col gap-3 max-h-80 overflow-y-auto custom-scrollbar">
                         {minimizedCircuitData.terms.length > 0 ? minimizedCircuitData.terms.map((term, idx) => {
                            const color = groupColors[idx % groupColors.length];
                            const isActive = activeGroupIndex === idx;
                            const isFaded = activeGroupIndex !== null && !isActive;

                            return (
                               <div key={idx} onClick={() => setActiveGroupIndex(isActive ? null : idx)}
                                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 transform ${color.border} ${color.bgLight} hover:-translate-y-0.5 active:scale-95 ${isActive ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : ''} ${isFaded ? 'opacity-40 grayscale-50' : 'opacity-100'}`}>
                                  <div className="flex justify-between items-center border-b border-gray-700/50 pb-2">
                                     <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full ${color.bg} ${isActive ? 'animate-pulse' : ''}`}></div><span className={`font-bold ${color.text}`}>กลุ่มที่ {idx + 1}</span></div>
                                     <span className="text-xs font-bold bg-gray-900/80 px-2 py-1 rounded text-gray-400">วง {term.indices.length} ตัว</span>
                                  </div>
                                  <div className="flex justify-between items-center pt-1 mt-1">
                                     <span className="text-sm text-gray-400 font-mono">ช่อง: {term.indices.join(', ')}</span>
                                     <span className="font-mono font-black text-lg text-white tracking-widest">{term.equationStr}</span>
                                  </div>
                               </div>
                            )
                         }) : <div className="text-center text-gray-500 py-6 font-medium">ไม่พบกลุ่มตัวแปรสำหรับ {kmapMode}</div>}
                      </div>
                    </div>

                    <div className={`${kmapMode === 'SOP' ? 'bg-purple-900/20 border-purple-500/50 text-purple-300' : 'bg-blue-900/20 border-blue-500/50 text-blue-300'} backdrop-blur-md rounded-2xl shadow-lg border w-full p-6 text-center transition-colors`}>
                       <p className="text-sm font-bold mb-2 uppercase tracking-widest">สมการที่ลดรูปแล้ว (Minimized {kmapMode})</p>
                       <p className="font-mono text-3xl font-black text-white break-all">Y = {finalEquationStr}</p>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="w-full bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 p-10 text-center">
                  <span className="text-5xl mb-4 block">⚠️</span><h2 className="text-xl font-bold text-gray-200 mb-2">จำนวนตัวแปรไม่รองรับการสร้าง K-Map</h2><p className="text-gray-400">แผนผังคาร์โนห์รองรับสมการที่มี 2 ถึง 4 ตัวแปรเท่านั้น (ปัจจุบันมี {vars.length} ตัวแปร)</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'circuit' && isValid && (
            <div className="w-full max-w-5xl flex flex-col items-center">
               <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-lg border border-purple-500/30 w-full overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-white/10 bg-gray-900/80 flex flex-col md:flex-row justify-between items-center gap-4">
                     {/* 🟢 แก้ไขข้อ 3: เปลี่ยนชื่อเป็น "วงจรลอจิก (Logic Circuit)" */}
                     <h3 className="text-xl font-black text-purple-400 tracking-wide">วงจรลอจิก (Logic Circuit)</h3>
                     <div className="flex bg-gray-950/80 p-1 rounded-lg border border-white/10">
                        <button onClick={() => setCircuitMode('FULL')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${circuitMode === 'FULL' ? 'bg-purple-600/90 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>จากสมการเริ่มต้น (Full)</button>
                        <button onClick={() => setCircuitMode('MINIMIZED')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${circuitMode === 'MINIMIZED' ? 'bg-purple-600/90 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>จากลดรูปแล้ว (Minimized)</button>
                      </div>
                  </div>
                  
                  {/* 🟢 แก้ไขข้อ 3: ข้อความเตือนเหลือแค่ "คลิกที่เกตหรือสมการย่อยเพื่อไฮไลท์" */}
                  <div className="p-4 bg-purple-900/10 border-b border-purple-500/20 text-center text-sm font-medium text-gray-300">
                     คลิกที่เกตหรือสมการย่อยเพื่อไฮไลท์
                  </div>

                  <BusStyleCircuitRenderer circuitData={currentCircuitData} activeTermIdx={activeGroupIndex} onTermClick={setActiveGroupIndex} />
                  
                  <div className="hidden">
                      {currentCircuitData.terms.map((_, idx) => (
                          <button key={idx} onClick={() => setActiveGroupIndex(activeGroupIndex === idx ? null : idx)} id={`term-trigger-${idx}`}></button>
                      ))}
                  </div>
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}