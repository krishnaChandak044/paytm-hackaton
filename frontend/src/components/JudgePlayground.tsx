import React, { useState } from 'react';
import { Sliders, RotateCcw, Sparkles, ShieldAlert, Award, Split, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ForecastOut } from '../types';

interface JudgePlaygroundProps {
  baseForecast: ForecastOut;
  currentForecast: ForecastOut;
  onRunScenario: (extraCashPaise: number, amountPaise?: number, dueDate?: string) => void;
  onReset: () => void;
  lang: 'en' | 'hi';
  onBack?: () => void;
}

export const JudgePlayground: React.FC<JudgePlaygroundProps> = ({
  baseForecast,
  currentForecast,
  onRunScenario,
  onReset,
  lang,
  onBack,
}) => {
  const isHi = lang === 'hi';
  const [extraCash, setExtraCash] = useState<number>(0);
  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  const fmtRs = (rs: number) => '₹' + rs.toLocaleString('en-IN');
  const fmtP = (p: number | null | undefined) => {
    if (p == null) return '—';
    return '₹' + Math.round(p / 100).toLocaleString('en-IN');
  };

  const applyChanges = (cashRs: number, split: boolean, dayOffset: number) => {
    const targetPaise = split ? Math.round(baseForecast.obligation_amount_paise / 2) : undefined;
    const d = new Date(baseForecast.due_date);
    d.setDate(d.getDate() + dayOffset);
    const newDate = d.toISOString().split('T')[0];
    onRunScenario(cashRs * 100, targetPaise, newDate);
    if (cashRs * 100 >= 1700000 || split) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleCash = (val: number) => { setExtraCash(val); applyChanges(val, isSplit, selectedDayOffset); };
  const handleSplit = () => { const n = !isSplit; setIsSplit(n); applyChanges(extraCash, n, selectedDayOffset); };
  const handleDay = (o: number) => { setSelectedDayOffset(o); applyChanges(extraCash, isSplit, o); };

  const applyPreset = (type: 'baseline' | 'cash17k' | 'split' | 'date_friday') => {
    if (type === 'baseline') { handleReset(); }
    else if (type === 'split') { setExtraCash(0); setIsSplit(true); setSelectedDayOffset(0); applyChanges(0, true, 0); }
    else { setExtraCash(0); setIsSplit(false); setSelectedDayOffset(1); applyChanges(0, false, 1); }
  };

  const handleReset = () => { setExtraCash(0); setIsSplit(false); setSelectedDayOffset(0); onReset(); };

  const gapHigh = currentForecast.possible_gap_high_paise ?? 0;
  const gapLow = currentForecast.possible_gap_low_paise ?? 0;
  const hasForecast = currentForecast.status === 'ready' && currentForecast.possible_gap_high_paise !== null;
  const isSafe = hasForecast && currentForecast.possible_gap_high_paise === 0;

  const presets = [
    { id: 'baseline', label: 'Reset to current plan', active: extraCash === 0 && !isSplit && selectedDayOffset === 0, color: 'bg-slate-600' },
    { id: 'split', label: `Model first payment: ${fmtP(Math.round(baseForecast.obligation_amount_paise / 2))}`, active: isSplit, color: 'bg-emerald-600' },
    { id: 'date_friday', label: 'Model one extra day', active: selectedDayOffset === 1, color: 'bg-cyan-600' },
  ] as const;

  return (
    <div className="bg-gradient-to-br from-[#001e54] via-[#002666] to-[#002970] text-white rounded-3xl p-4 shadow-paytm-lg border-2 border-cyan-400/40 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-[#00baf2] rounded-full blur-3xl opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/15">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-cyan-200 border border-white/10 transition-all flex items-center gap-1 text-[10px] font-bold"
              title="Return to Radar"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Radar</span>
            </button>
          )}
          <div className="p-2 bg-[#00baf2] text-[#002970] rounded-xl shadow-xs">
            <Sliders className="w-4 h-4 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold">{isHi ? 'व्हाट-इफ़ सिम्युलेटर' : 'Payment plan simulator'}</span>
              <span className="bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Sparkles className="w-2 h-2" /> Live Math
              </span>
            </div>
            <p className="text-[10px] text-cyan-200/80">Deterministic scenario testing</p>
          </div>
        </div>
        <button onClick={handleReset} className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-[10px] font-bold text-cyan-100 border border-white/10">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Clear scenario shortcuts */}
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p.id)}
            className={`py-2 px-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${
              p.active ? `${p.color} text-white shadow-sm` : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Slider + quick picks */}
      <div className="space-y-3">
        <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
          <div className="flex justify-between items-center text-[11px] mb-2">
            <span className="text-cyan-200 font-semibold">{isHi ? 'गल्ले में नकद' : 'Extra usable shop cash'}</span>
            <span className="text-[#00baf2] font-mono font-black">{fmtRs(extraCash)}</span>
          </div>
          <p className="mb-2 text-[9px] leading-snug text-cyan-100/70">Add only cash you have counted and can use. This changes the scenario estimate; it does not update your bank balance.</p>
          <input
            type="range" min="0" max="25000" step="1000" value={extraCash}
            onChange={(e) => handleCash(Number(e.target.value))}
            className="w-full h-2 bg-[#001e4d] rounded-lg appearance-none cursor-pointer accent-[#00baf2]"
          />
          <div className="flex gap-1.5 mt-2">
            {[0, 5000, 10000, 17000].map((v) => (
              <button key={v} onClick={() => handleCash(v)}
                className={`text-[9px] px-2 py-1 rounded-lg font-bold flex-1 transition-colors ${
                  extraCash === v ? 'bg-[#00baf2] text-[#002970]' : 'bg-white/10 text-cyan-200 hover:bg-white/20'
                }`}>
                {v === 0 ? '₹0' : `₹${v.toLocaleString('en-IN')}`}
              </button>
            ))}
          </div>
        </div>

        {/* Split toggle */}
        <div className="bg-white/10 p-3 rounded-2xl border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-cyan-300 shrink-0" />
            <div>
              <div className="text-[11px] font-semibold text-cyan-200">{isHi ? 'पहली किस्त का अनुमान' : 'Model a 50% first instalment'}</div>
              <div className="text-[9px] leading-snug text-cyan-100/70 mt-0.5">Assumes supplier agrees. Tests {fmtP(Math.round(baseForecast.obligation_amount_paise / 2))} due now; remaining half is not included in this view.</div>
            </div>
          </div>
          <button onClick={handleSplit}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 active:scale-95 transition-all ${
              isSplit ? 'bg-emerald-400 text-emerald-950' : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
            }`}>
            {isSplit ? 'Applied' : 'Model'}
          </button>
        </div>

        {/* Date shift */}
        <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-cyan-200">{isHi ? 'तारीख बदलें' : 'Shift Due Date'}</span>
            <span className="text-[9px] text-cyan-300 font-mono">+{selectedDayOffset}d collections</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[{ label: 'Thu', offset: 0 }, { label: 'Fri +1d', offset: 1 }, { label: 'Sat +2d', offset: 2 }].map((item) => (
              <button key={item.offset} onClick={() => handleDay(item.offset)}
                className={`py-1.5 text-[10px] rounded-xl font-bold text-center active:scale-95 transition-all ${
                  selectedDayOffset === item.offset ? 'bg-[#00baf2] text-[#002970]' : 'bg-white/10 text-cyan-200 hover:bg-white/20'
                }`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      <div className={`mt-4 p-3.5 rounded-2xl border flex items-center gap-2.5 transition-all ${
        isSafe ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100' : 'bg-amber-950/80 border-amber-400/80 text-amber-100'
      }`}>
        <div className={`p-2 rounded-xl shrink-0 ${isSafe ? 'bg-emerald-500' : 'bg-amber-500'} text-white`}>
          {isSafe ? <Award className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <div className="font-extrabold text-sm flex items-center justify-between">
            <span>{!hasForecast ? 'Not enough data for a reliable estimate' : isSafe ? (isHi ? '✓ देय राशि कवर' : 'Covered in this scenario') : `Possible gap: ${fmtP(gapLow)}–${fmtP(gapHigh)}`}</span>
            <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/20 font-black uppercase">{currentForecast.scenario_only ? 'SCENARIO' : 'BASELINE'}</span>
          </div>
          {hasForecast && isSplit && <div className="mt-1 text-[9px] text-white/70">The remaining {fmtP(Math.round(baseForecast.obligation_amount_paise / 2))} is excluded from this first-instalment estimate.</div>}
          {hasForecast && !isSafe && (
            <div className="text-[10px] text-white/70 mt-0.5">
              Reduced by ₹{Math.round(((baseForecast.possible_gap_high_paise ?? 0) - gapHigh) / 100).toLocaleString('en-IN')} from baseline
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
