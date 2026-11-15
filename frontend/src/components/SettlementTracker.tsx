import React from 'react';
import { Clock, QrCode } from 'lucide-react';
import { UnmatchedSettlement } from '../types';

interface SettlementTrackerProps {
  unmatched: UnmatchedSettlement[];
  lang: 'en' | 'hi';
}

export const SettlementTracker: React.FC<SettlementTrackerProps> = ({ unmatched, lang }) => {
  const isHi = lang === 'hi';
  const fmt = (paise: number) => '₹' + Math.round(paise / 100).toLocaleString('en-IN');

  return (
    <div className="bg-white rounded-3xl p-4 shadow-paytm border border-slate-200/90 space-y-3">
      <div className="flex items-center gap-1.5">
        <h3 className="font-extrabold text-[#002970] text-sm">{isHi ? 'पेटीएम सेटलमेंट' : 'Collections & Settlements'}</h3>
        <span className="bg-cyan-100 text-[#002970] text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-cyan-200">
          <QrCode className="w-2.5 h-2.5 text-[#00baf2]" /> DEMO
        </span>
      </div>

      {unmatched.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400">No pending settlements.</div>
      ) : (
        <div className="space-y-2">
          {unmatched.map((item) => (
            <div key={item.event_id} className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-slate-900">#{item.order_reference}</div>
                  <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded-full border border-amber-300">
                    Pending
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-[#002970] font-mono">{fmt(item.amount_paise)}</div>
                <div className="text-[9px] text-slate-400 font-medium">In transit</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
