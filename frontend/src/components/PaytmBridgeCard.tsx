import React, { useState } from 'react';
import { Zap, CheckCircle2, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BridgeCreditResult } from '../types';

interface PaytmBridgeCardProps {
  gapAmountPaise: number;
  lang: 'en' | 'hi';
  onActivate: (amountPaise: number) => Promise<BridgeCreditResult | void>;
  onReset?: () => void;
  activeLoanRef?: string | null;
}

export const PaytmBridgeCard: React.FC<PaytmBridgeCardProps> = ({
  gapAmountPaise,
  lang,
  onActivate,
  onReset,
  activeLoanRef,
}) => {
  const isHi = lang === 'hi';
  const [loading, setLoading] = useState(false);
  const [loanResult, setLoanResult] = useState<BridgeCreditResult | null>(null);

  // Round up to nearest ₹1,000, minimum ₹5,000, default ₹15,000
  const recommendedRupees = Math.max(
    5000,
    Math.ceil((gapAmountPaise || 1500000) / 100000) * 1000
  );
  const recommendedPaise = recommendedRupees * 100;

  const handleActivate = async () => {
    setLoading(true);
    try {
      const res = await onActivate(recommendedPaise);
      if (res) {
        setLoanResult(res);
      }
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setLoanResult(null);
    if (onReset) onReset();
  };

  const isLoanActive = Boolean(loanResult || activeLoanRef);
  const displayRef = loanResult?.loan_reference || activeLoanRef || 'PAYTM-OD-9482';

  if (isLoanActive) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-[#002970] p-4 text-white shadow-paytm-lg border border-emerald-400/50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white">
                  {isHi ? 'Paytm 3-दिन ब्रिज लोन सक्रिय' : 'Paytm 3-Day Bridge Active'}
                </span>
                <span className="text-[9px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/40 px-1.5 py-0.5 rounded-full font-bold">
                  DISBURSED
                </span>
              </div>
              <p className="text-[10px] text-emerald-200 font-mono mt-0.5">
                Ref #{displayRef} · SBI ••4912
              </p>
            </div>
          </div>

          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[9px] font-bold text-white border border-white/10"
          >
            <RotateCcw className="w-2.5 h-2.5" /> {isHi ? 'रीसेट' : 'Reset'}
          </button>
        </div>

        <div className="mt-3 p-3 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-emerald-200 font-bold">
              {isHi ? 'स्वीकृत राशि' : 'Bridge Credited'}
            </div>
            <div className="text-lg font-black text-white font-mono leading-none mt-0.5">
              ₹{recommendedRupees.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-emerald-200 font-bold">
              {isHi ? 'स्वचालित चुकौती' : 'Auto-Repayment'}
            </div>
            <div className="text-xs font-bold text-emerald-100 mt-0.5">
              {isHi ? 'शुक्रवार QR सेटलमेंट से' : 'Friday QR Settlements'}
            </div>
          </div>
        </div>

        <p className="text-[10px] text-emerald-100/90 mt-2.5 flex items-center gap-1 leading-tight font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          {isHi
            ? 'गुप्ता ट्रेडर्स का भुगतान 100% सुरक्षित है। कोई अतिरिक्त ब्याज नहीं (केवल ₹49 शुल्क)।'
            : 'Supplier payment fully secured. Zero compound interest (flat ₹49 bridge fee).'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#001740] via-[#002970] to-[#003b8e] p-4 text-white shadow-paytm-lg border border-cyan-400/40 relative overflow-hidden">
      {/* Decorative ambient blur */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-[#00baf2] rounded-full blur-2xl opacity-25 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded-lg bg-[#00baf2] text-[#002970]">
            <Zap className="w-3.5 h-3.5 font-black fill-current" />
          </span>
          <span className="font-extrabold text-xs text-white tracking-tight">
            {isHi ? 'Paytm 3-दिन माइक्रो-ब्रिज लोन' : 'Paytm 3-Day Micro-Bridge Overdraft'}
          </span>
        </div>
        <span className="text-[9px] bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
          Pre-Approved
        </span>
      </div>

      <p className="text-[10px] text-cyan-100/80 leading-snug mb-3">
        {isHi
          ? 'कैश की कमी होने पर चेक बाउंस न होने दें। 30 सेकंड में बैंक में पाएं।'
          : 'Prevent cheque bounces before Friday collections. Disbursed directly to your verified bank.'}
      </p>

      {/* Offer Box */}
      <div className="bg-black/25 rounded-2xl p-3 border border-white/10 mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-cyan-300 font-bold">
            {isHi ? 'पूर्व-स्वीकृत ब्रिज' : 'Pre-Approved Bridge'}
          </div>
          <div className="text-xl font-black text-white font-mono mt-0.5">
            ₹{recommendedRupees.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="text-right border-l border-white/10 pl-3">
          <div className="text-[9px] uppercase tracking-wider text-cyan-300 font-bold">
            {isHi ? 'शुल्क' : 'Flat Fee'}
          </div>
          <div className="text-sm font-extrabold text-white mt-0.5 font-mono">
            ₹49 <span className="text-[9px] font-normal text-cyan-200">total</span>
          </div>
          <div className="text-[8px] text-cyan-300/80">3-day tenure</div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-1.5 text-[9px] text-cyan-100 mb-3 font-medium">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Instant credit to SBI ••4912</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>Auto-repaid from Friday QR</span>
        </div>
      </div>

      {/* 1-Tap CTA */}
      <button
        onClick={handleActivate}
        disabled={loading}
        className="w-full py-2.5 px-3 rounded-2xl bg-[#00baf2] hover:bg-[#00a3d6] active:scale-[0.98] text-[#002970] font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
      >
        <Zap className="w-3.5 h-3.5 fill-current" />
        <span>
          {loading
            ? (isHi ? 'क्रेडिट किया जा रहा है...' : 'Disbursing to Bank...')
            : isHi
            ? `⚡ ₹${recommendedRupees.toLocaleString('en-IN')} ब्रिज सक्रिय करें`
            : `⚡ Activate ₹${recommendedRupees.toLocaleString('en-IN')} Bridge Now`}
        </span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

