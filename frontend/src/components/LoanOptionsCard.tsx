import React from 'react';
import { ArrowUpRight, CheckCircle2, HandCoins } from 'lucide-react';

interface LoanOptionsCardProps {
  lang: 'en' | 'hi';
}

const PAYTM_BUSINESS_LOAN_URL = 'https://paytm.com/loans-credit-cards/business-loan/';

export const LoanOptionsCard: React.FC<LoanOptionsCardProps> = ({ lang }) => {
  const isHi = lang === 'hi';

  return (
    <section aria-labelledby="loan-options-title" className="overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 bg-gradient-to-r from-[#f0fbff] to-white px-3.5 py-3">
        <span className="rounded-xl bg-cyan-100 p-2 text-[#007da8]">
          <HandCoins className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="loan-options-title" className="text-[12px] font-extrabold text-[#002970]">
            {isHi ? 'जाँच के बाद भी कमी हो? Paytm बिज़नेस लोन देखें' : 'Still short after checking? Explore Paytm business loans'}
          </h3>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
            {isHi
              ? 'पहले दुकान की नकदी, दूसरे खाते और बाकी बिल जोड़ें। कमी फिर भी रहे तो Paytm for Business में पात्रता और उपलब्ध ऑफर देखें।'
              : 'First add shop cash, other accounts, and any missing bills. If a gap remains, check eligibility and available offers in Paytm for Business.'}
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-100 px-3.5 py-3">
        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
          {isHi ? 'कैसे आवेदन करें' : 'How to apply'}
        </p>
        <ol className="space-y-1.5 text-[10px] leading-relaxed text-slate-600">
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /><span>{isHi ? 'Paytm for Business में Business Loan खोलकर अपना उपलब्ध ऑफर देखें।' : 'In Paytm for Business, open Business Loan and check your available offer.'}</span></li>
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /><span>{isHi ? 'स्वीकार करने से पहले लेंडर, ब्याज/APR, फीस, कुल भुगतान, रोज़ाना किस्त और सेटलमेंट कटौती की शर्तें पढ़ें।' : 'Before accepting, review the lender, interest/APR, fees, total repayment, daily instalment, and any settlement deductions.'}</span></li>
        </ol>

        <a
          href={PAYTM_BUSINESS_LOAN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#002970] px-3 py-2 text-center text-[11px] font-extrabold text-white transition hover:bg-[#003b8e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00baf2] focus-visible:ring-offset-2"
        >
          {isHi ? 'Paytm की ऑफिशियल लोन जानकारी खोलें' : 'Open Paytm’s official business-loan page'}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
        <p className="text-[9px] leading-relaxed text-slate-500">
          {isHi
            ? 'लोन Paytm के बैंक/NBFC पार्टनर देते हैं। Munim पात्रता नहीं जाँचता, मंज़ूरी/डिस्बर्सल नहीं करता। यह लिंक आपका forecast या निजी डेटा नहीं भेजता; आवेदन Paytm में अलग से करें।'
            : 'Loans are provided by Paytm bank/NBFC partners. Munim does not check eligibility, approve or disburse credit. This link sends no forecast or personal data; apply separately in Paytm.'}
        </p>
      </div>
    </section>
  );
};
