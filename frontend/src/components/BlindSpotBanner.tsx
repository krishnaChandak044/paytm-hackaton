import React, { useState } from 'react';
import { Banknote, Building2, Receipt, AlertCircle, Check, ChevronRight, X } from 'lucide-react';

interface FundSlot {
  id: 'cash' | 'secondary_bank' | 'cheque';
  name: string;
  nameHi: string;
  subtext: string;
  icon: React.ReactNode;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  placeholder: string;
}

const FUND_SLOTS: FundSlot[] = [
  {
    id: 'cash',
    name: 'Cash in Drawer (गल्ला)',
    nameHi: 'गल्ले का नकद',
    subtext: 'Cash you have counted in the shop drawer',
    icon: <Banknote className="w-4 h-4" />,
    accentColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    placeholder: 'e.g. 15000',
  },
  {
    id: 'secondary_bank',
    name: 'Secondary Bank (HDFC/ICICI)',
    nameHi: 'अन्य बैंक खाता',
    subtext: 'Available balance in another account',
    icon: <Building2 className="w-4 h-4" />,
    accentColor: 'text-[#002970]',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    placeholder: 'e.g. 25000',
  },
  {
    id: 'cheque',
    name: 'Pending Cheques / Cash Credit',
    nameHi: 'आगामी चेक / क्रेडिट',
    subtext: 'Expected to clear before the payment is due',
    icon: <Receipt className="w-4 h-4" />,
    accentColor: 'text-amber-800',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    placeholder: 'e.g. 10000',
  },
];

interface BlindSpotBannerProps {
  lang: 'en' | 'hi';
  onDeclareExtra: (totalPaise: number) => void;
}

export const BlindSpotBanner: React.FC<BlindSpotBannerProps> = ({ lang, onDeclareExtra }) => {
  const isHi = lang === 'hi';

  // Declared amounts in rupees per slot id
  const [declared, setDeclared] = useState<Record<string, number>>({});
  // Which slot input is open
  const [openId, setOpenId] = useState<string | null>(null);
  // Draft input value
  const [draft, setDraft] = useState<string>('');
  // Applied total (paise)
  const [appliedTotal, setAppliedTotal] = useState<number>(0);
  const [applied, setApplied] = useState(false);

  const totalRupees = Object.values(declared).reduce((a, b) => a + b, 0);

  const handleOpen = (id: string) => {
    setOpenId(id === openId ? null : id);
    setDraft(declared[id] ? String(declared[id]) : '');
  };

  const handleSave = (id: string) => {
    const val = Number(draft.replace(/,/g, '').trim());
    if (!Number.isFinite(val) || val < 0) {
      setOpenId(null);
      return;
    }
    setDeclared((prev) => ({ ...prev, [id]: Math.round(val) }));
    setOpenId(null);
    setApplied(false);
  };

  const handleClear = (id: string) => {
    setDeclared((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setApplied(false);
  };

  const handleApply = () => {
    const totalPaise = totalRupees * 100;
    setAppliedTotal(totalPaise);
    setApplied(true);
    onDeclareExtra(totalPaise);
  };

  const declaredCount = Object.keys(declared).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 overflow-hidden shadow-2xs">
      {/* Header strip */}
      <div className="flex items-start gap-2 px-3.5 pt-3 pb-2">
        <div className="p-1.5 rounded-lg bg-amber-100 shrink-0 mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-800" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-[11px] text-slate-800">
            {isHi
              ? 'अन्य अप्रत्यक्ष फंड जोड़ें (गल्ला / दूसरा बैंक)'
              : 'Have offline cash or a 2nd bank account?'}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5 font-medium leading-tight">
            {isHi
              ? 'Paytm केवल जुड़े हुए खाते को देखता है। वास्तविक स्थिति अपडेट करने के लिए जोड़ें:'
              : 'Only the linked bank balance is included. Add other available funds to improve this estimate:'}
          </div>
        </div>
      </div>

      {/* Fund slots chips */}
      <div className="px-3.5 pb-3 space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {FUND_SLOTS.map((slot) => {
            const hasDeclared = declared[slot.id] != null;
            const isOpen = openId === slot.id;
            return (
              <button
                key={slot.id}
                onClick={() => handleOpen(slot.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all active:scale-95 ${
                  hasDeclared
                    ? `${slot.bgColor} ${slot.borderColor} ${slot.accentColor}`
                    : isOpen
                    ? 'bg-white border-[#00baf2] text-[#002970] ring-1 ring-[#00baf2] shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className={hasDeclared ? slot.accentColor : 'text-slate-400'}>{slot.icon}</span>
                <span>{isHi ? slot.nameHi : slot.name}</span>
                {hasDeclared ? (
                  <span className="ml-0.5 font-black font-mono">
                    ₹{declared[slot.id].toLocaleString('en-IN')}
                  </span>
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Inline input drawer */}
        {openId && (() => {
          const slot = FUND_SLOTS.find((s) => s.id === openId)!;
          return (
            <div className={`rounded-xl border p-3 ${slot.bgColor} ${slot.borderColor} space-y-2`}>
              <div className="flex items-center justify-between">
                <div className={`text-[10px] font-extrabold flex items-center gap-1 ${slot.accentColor}`}>
                  {slot.icon}
                  {isHi ? slot.nameHi : slot.name}
                </div>
                <span className="text-[9px] text-slate-500 font-medium">{slot.subtext}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-700">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave(openId);
                      if (e.key === 'Escape') setOpenId(null);
                    }}
                    placeholder={slot.placeholder}
                    autoFocus
                    className="w-full pl-6 pr-3 py-2 rounded-xl border border-white bg-white text-sm font-black text-[#002970] focus:outline-none focus:ring-2 focus:ring-[#00baf2] shadow-xs font-mono"
                  />
                </div>
                <button
                  onClick={() => handleSave(openId)}
                  className="px-3 py-2 rounded-xl bg-[#002970] text-white text-[10px] font-bold active:scale-95 shadow-xs flex items-center gap-1 shrink-0"
                >
                  <Check className="w-3 h-3 text-[#00baf2]" /> {isHi ? 'सेव' : 'Save'}
                </button>
                {declared[openId] != null && (
                  <button
                    onClick={() => {
                      handleClear(openId);
                      setOpenId(null);
                    }}
                    className="p-2 rounded-xl bg-white border border-slate-200 active:scale-95 text-rose-500 hover:bg-rose-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="text-[9px] text-slate-500 font-medium">
                {isHi
                  ? 'व्यापारी द्वारा घोषित · इस सिमुलेशन में तुरंत शामिल होगा'
                  : 'Self-declared by merchant · included in immediate what-if recalculation'}
              </div>
            </div>
          );
        })()}

        {/* Total + Apply row */}
        {declaredCount > 0 && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
            <div>
              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                {isHi ? 'कुल घोषित फंड' : 'Total declared unlinked funds'}
              </div>
              <div className="text-sm font-black text-[#002970] font-mono">
                ₹{totalRupees.toLocaleString('en-IN')}
                {applied && appliedTotal === totalRupees * 100 && (
                  <span className="ml-1.5 text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-200">
                    ✓ In Forecast
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleApply}
              disabled={applied && appliedTotal === totalRupees * 100}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs ${
                applied && appliedTotal === totalRupees * 100
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                  : 'bg-[#002970] text-white hover:bg-[#001e54]'
              }`}
            >
              {applied && appliedTotal === totalRupees * 100 ? (
                <>
                  <Check className="w-3 h-3 text-emerald-700" /> {isHi ? 'अपडेटेड' : 'Applied'}
                </>
              ) : (
                <>{isHi ? 'रडार अपडेट करें →' : 'Recalculate Radar →'}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
