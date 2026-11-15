import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowRight,
  Split,
  Wallet,
  HelpCircle,
} from 'lucide-react';
import { ForecastOut } from '../types';
import { BlindSpotBanner } from './BlindSpotBanner';
import { LoanOptionsCard } from './LoanOptionsCard';

interface CashGapRadarProps {
  forecast: ForecastOut;
  lang: 'en' | 'hi';
  onOpenPlayground: () => void;
  onQuickSolve?: (action: 'cash' | 'split' | 'date') => void;
  onAddPayment?: () => void;
  onDeclareExtra?: (totalPaise: number) => void;
}

const fmt = (paise: number | null | undefined) => {
  if (paise == null) return '—';
  const r = Math.round(paise / 100);
  return '₹' + r.toLocaleString('en-IN');
};

export const CashGapRadar: React.FC<CashGapRadarProps> = ({
  forecast,
  lang,
  onOpenPlayground,
  onQuickSolve,
  onDeclareExtra,
}) => {
  const isHi = lang === 'hi';
  const { obligation_amount_paise: obl, balance_paise: bal,
    expected_inflows_low_paise: inflowLow, expected_inflows_high_paise: inflowHigh,
    possible_gap_low_paise: gapLow, possible_gap_high_paise: gapHigh } = forecast;

  const ready = forecast.status === 'ready' && gapLow != null && gapHigh != null;
  const isDemo = forecast.coverage_tier?.includes('[Synthetic Connector]') ?? false;
  const safe = ready && gapHigh === 0;
  const partial = ready && gapHigh! > 0 && gapLow === 0;
  const risky = ready && !safe && !partial;

  // Coverage bar widths
  const denom = Math.max(obl, (bal ?? 0) + (inflowHigh ?? 0), 1);
  const balPct = Math.min(100, Math.round(((bal ?? 0) / denom) * 100));
  const inflowBasePct = Math.min(100, Math.round(((inflowLow ?? 0) / denom) * 100));
  const inflowUpPct = Math.min(100, Math.round((((inflowHigh ?? 0) - (inflowLow ?? 0)) / denom) * 100));

  const statusColor = !ready ? 'bg-slate-500' : safe ? 'bg-emerald-600' : partial ? 'bg-amber-500' : 'bg-rose-600';
  const statusLabel = !ready ? 'LIMITED' : safe ? 'SAFE ✓' : partial ? 'MONITOR' : 'RISK';
  const statusBg = !ready ? 'bg-slate-50 border-slate-200' : safe ? 'bg-emerald-50 border-emerald-200' : partial ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';

  return (
    <div className="bg-white rounded-3xl shadow-paytm border border-slate-200/90 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#002970] via-[#003478] to-[#001f54] p-4 text-white">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="bg-[#00baf2] text-[#002970] font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              {isHi ? 'कैश-गैप रडार' : 'Cash-Gap Radar'}
            </span>
            <span className="text-[9px] text-cyan-300 flex items-center gap-0.5 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/10">
              <ShieldCheck className="w-2.5 h-2.5" />
              {isDemo ? 'DEMO' : 'LIVE'}
            </span>
          </div>
          <span className="text-[9px] text-cyan-200 flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full font-bold">
            <Calendar className="w-2.5 h-2.5 text-[#00baf2]" />
            {forecast.due_date} · {forecast.days_until_due}d
          </span>
        </div>

        <div className="flex items-end justify-between gap-3 mt-1">
          <div>
            <h2 className="text-base font-extrabold text-white leading-tight">{forecast.payee}</h2>
            <p className="text-[10px] text-cyan-300 mt-0.5">{isHi ? 'पुष्ट दायित्व' : 'Confirmed obligation'}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold">{isHi ? 'देय राशि' : 'Due'}</div>
            <div className="text-2xl font-black text-white font-mono">{fmt(obl)}</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Status pill */}
        <div className={`flex items-center justify-between gap-2 p-3 rounded-2xl border ${statusBg}`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-xl shrink-0 ${statusColor} text-white ${risky ? 'animate-pulse' : ''}`}>
              {!ready ? <HelpCircle className="w-3.5 h-3.5" /> : safe ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            </div>
            <span className="font-extrabold text-xs text-slate-800">
              {!ready
                ? (forecast.status === 'stale_balance' ? 'Balance stale' : 'Insufficient data')
                : safe ? (isHi ? 'पूरा फंड उपलब्ध' : 'Fully covered')
                : partial ? (isHi ? 'मध्यम जोखिम' : 'Moderate risk')
                : (isHi ? `₹${Math.round((gapLow ?? 0)/100).toLocaleString('en-IN')}–₹${Math.round((gapHigh ?? 0)/100).toLocaleString('en-IN')} कमी` : `Gap ${fmt(gapLow)}–${fmt(gapHigh)}`)}
            </span>
          </div>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase ${statusColor} text-white`}>
            {statusLabel}
          </span>
        </div>

        {/* Key figures */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">Connected balance</div>
            <div className="font-mono text-sm font-black text-[#002970]">{fmt(bal)}</div>
            <div className="mt-1 text-[9px] text-slate-500">{forecast.balance_observed_at ? `Updated ${new Date(forecast.balance_observed_at).toLocaleString()}` : 'No connected balance'}</div>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3">
            <div className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-cyan-800"><TrendingUp className="h-3 w-3" /> Estimated collections</div>
            <div className="font-mono text-sm font-black text-[#002970]">{inflowLow == null ? 'Unavailable' : `${fmt(inflowLow)}–${fmt(inflowHigh)}`}</div>
            <div className="mt-1 text-[9px] text-slate-500">Historical range; not guaranteed</div>
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <span className="text-[10px] text-slate-600">Other confirmed payments before this date</span>
            <b className="font-mono text-xs text-[#002970]">{fmt(forecast.other_confirmed_obligations_paise)}</b>
          </div>
        </div>

        {/* Coverage bar */}
        <div className="bg-slate-50 px-3.5 py-3 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 mb-1.5">
            <span>{isHi ? 'कवरेज' : 'Coverage'}</span>
            <span className="text-[#002970] font-mono">{fmt(obl)}</span>
          </div>
          <div className="h-5 w-full bg-slate-200 rounded-xl overflow-hidden flex gap-0.5 p-0.5">
            <div style={{ width: `${ready ? balPct : 0}%` }} className="bg-emerald-600 h-full rounded-lg transition-all duration-300" title={`Bank ${fmt(bal)}`} />
            <div style={{ width: `${ready ? inflowBasePct : 0}%` }} className="bg-[#00baf2] h-full rounded-lg transition-all duration-300" title="Base inflows" />
            <div style={{ width: `${ready ? inflowUpPct : 0}%` }} className="bg-cyan-200 h-full rounded-lg transition-all duration-300" />
            {ready && !safe && <div className="flex-1 bg-rose-200/60 border-l-2 border-dashed border-rose-400 rounded-r-lg h-full" />}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />Bank</span>
            <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-[#00baf2] inline-block" />Inflows</span>
            {ready && !safe && <span className="flex items-center gap-1 text-[9px] text-rose-600 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />Gap</span>}
          </div>
        </div>

        {ready && !safe && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] leading-relaxed text-amber-950">
            <b className="block text-[11px]">What this gap means</b>
            This is an estimate of funds that may be missing by the due date, based on the balance, confirmed bills, and estimated collections shown here. It is not a confirmed shortage. Add any shop cash or other accounts before deciding what to do.
          </div>
        )}

        {ready && gapLow! > 0 && <LoanOptionsCard lang={lang} />}

        {/* Quick solve shortcuts */}
        {ready && !safe && onQuickSolve && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Explore possible next steps</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button onClick={() => onQuickSolve('cash')} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-left hover:border-emerald-300 hover:bg-emerald-50">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span><b className="block text-[10px] text-slate-800">Add cash available in the shop</b><small className="mt-0.5 block text-[9px] leading-snug text-slate-500">Enter an amount; Munim recalculates using your estimate.</small></span>
              </button>
              <button onClick={() => onQuickSolve('split')} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-left hover:border-cyan-300 hover:bg-cyan-50">
                <Split className="mt-0.5 h-4 w-4 shrink-0 text-[#00baf2]" /><span><b className="block text-[10px] text-slate-800">Test a 50% first instalment</b><small className="mt-0.5 block text-[9px] leading-snug text-slate-500">{fmt(Math.round(obl / 2))} first instalment, if supplier agrees.</small></span>
              </button>
            </div>
            <p className="mt-2 text-[9px] leading-snug text-slate-500">Planning scenarios only. Munim won’t contact the supplier or move money.</p>
          </div>
        )}

        {/* Blind Spot Banner — always visible */}
        {onDeclareExtra && (
          <BlindSpotBanner lang={lang} onDeclareExtra={onDeclareExtra} />
        )}

        <button onClick={onOpenPlayground} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-[#002970] hover:bg-[#001e54] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#00baf2]" />
          {isHi ? 'सिम्युलेटर खोलें' : 'Open What-If Simulator'}
          <ArrowRight className="w-3 h-3 text-cyan-300" />
        </button>
      </div>
    </div>
  );
};
