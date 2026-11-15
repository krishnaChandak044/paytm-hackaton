import React, { useState } from 'react';
import { Lightbulb, Zap, Split, CalendarClock, Wallet, Check } from 'lucide-react';
import { Advice, ActionOption } from '../types';

interface ActionAdvisorProps {
  advice: Advice;
  lang: 'en' | 'hi';
  onSelectAction: (code: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  DECLARE_CASH: <Wallet className="w-5 h-5 text-emerald-600" />,
  VERIFY_COVERAGE: <Wallet className="w-5 h-5 text-emerald-600" />,
  SPLIT_PAYMENT: <Split className="w-5 h-5 text-[#00baf2]" />,
  SUPPLIER_SPLIT: <Split className="w-5 h-5 text-[#00baf2]" />,
  SHIFT_DATE: <CalendarClock className="w-5 h-5 text-purple-600" />,
  PAYTM_EARLY_SETTLEMENT: <Zap className="w-5 h-5 text-amber-500" />,
  SETTLEMENT_REVIEW: <Lightbulb className="w-5 h-5 text-[#002970]" />,
};

export const ActionAdvisor: React.FC<ActionAdvisorProps> = ({ advice, lang, onSelectAction }) => {
  const isHi = lang === 'hi';
  const [selected, setSelected] = useState<string | null>(null);

  const handle = (opt: ActionOption) => {
    setSelected(opt.code);
    onSelectAction(opt.code);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-paytm border border-slate-200/90">
      <div className="flex items-center gap-1.5 mb-3">
        <h3 className="font-bold text-[#002970] text-sm">{isHi ? 'समाधान विकल्प' : 'Quick Actions'}</h3>
        <span className="bg-cyan-100 text-[#002970] text-[9px] font-black px-1.5 py-0.5 rounded-full">Review first</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {advice.options.map((opt) => {
          const isActive = selected === opt.code;
          const icon = ICON_MAP[opt.code] ?? <Lightbulb className="w-5 h-5 text-[#002970]" />;
          return (
            <button
              key={opt.code}
              onClick={() => handle(opt)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-center transition-all active:scale-[0.97] ${
                isActive
                  ? 'bg-cyan-50 border-[#00baf2] ring-1 ring-[#00baf2]'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <div className={`p-2.5 rounded-xl shadow-xs border ${isActive ? 'bg-cyan-100 border-cyan-200' : 'bg-white border-slate-200'}`}>
                {icon}
              </div>
              <div>
                <div className="font-bold text-[11px] text-[#002970] leading-tight">{opt.title}</div>
                <p className="mt-1 text-[9px] leading-snug text-slate-500">{opt.prerequisite}</p>
                {isActive && (
                  <div className="flex items-center justify-center gap-0.5 mt-1 text-[9px] text-emerald-700 font-bold">
                    <Check className="w-2.5 h-2.5" /> Scenario opened for review
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
