import React, { useState } from 'react';
import { Check, Calendar, X, Sparkles } from 'lucide-react';
import { CandidateObligation } from '../types';

interface CandidateObligationsProps {
  candidates: CandidateObligation[];
  lang: 'en' | 'hi';
  onConfirmCandidate: (candidate: CandidateObligation) => void;
  onInterpret: (candidate: CandidateObligation) => Promise<{category_hint: string; explanation: string; confidence: string}>;
}

export const CandidateObligations: React.FC<CandidateObligationsProps> = ({
  candidates,
  lang,
  onConfirmCandidate,
  onInterpret,
}) => {
  const isHi = lang === 'hi';
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [personal, setPersonal] = useState<string[]>([]);
  const [interpretations, setInterpretations] = useState<Record<string, {category_hint: string; explanation: string; confidence: string}>>({});
  const [loadingInterpretation, setLoadingInterpretation] = useState<string | null>(null);
  const [interpretationError, setInterpretationError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    candidate: CandidateObligation;
    name: string;
    amountRs: string;
    dueDate: string;
  } | null>(null);

  const fmt = (paise: number) => '₹' + Math.round(paise / 100).toLocaleString('en-IN');
  const getName = (c: CandidateObligation) => c.payee ?? c.counterparty ?? 'Possible payment';
  const visible = candidates.filter((c) => !dismissed.includes(getName(c)));

  const handleStartConfirm = (candidate: CandidateObligation) => {
    const name = getName(candidate);
    const amount = candidate.suggested_amount_paise ?? candidate.historical_amount_max_paise ?? 450000;
    setConfirmModal({
      candidate,
      name,
      amountRs: String(Math.round(amount / 100)),
      dueDate: candidate.suggested_date ?? new Date().toISOString().slice(0, 10),
    });
  };

  const handleSaveConfirm = () => {
    if (!confirmModal) return;
    const { candidate, name, amountRs, dueDate } = confirmModal;
    const amt = Number(amountRs.replace(/,/g, '').trim());
    if (!Number.isFinite(amt) || amt <= 0 || !dueDate) return;
    setConfirmed((p) => [...p, name]);
    onConfirmCandidate({
      ...candidate,
      payee: name,
      suggested_amount_paise: Math.round(amt * 100),
      suggested_date: dueDate,
    });
    setConfirmModal(null);
  };

  const interpret = async (candidate: CandidateObligation, name: string) => {
    setLoadingInterpretation(name);
    setInterpretationError(null);
    try {
      const result = await onInterpret(candidate);
      setInterpretations((previous) => ({ ...previous, [name]: result }));
    } catch (error) {
      setInterpretationError(error instanceof Error ? error.message : 'AI interpretation unavailable.');
    } finally {
      setLoadingInterpretation(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 shadow-paytm border border-slate-200/90 space-y-3">
      <div className="flex items-center gap-1.5">
        <h3 className="font-extrabold text-[#002970] text-sm">{isHi ? 'संभावित आवर्ती भुगतान' : 'Detected Recurring Debits'}</h3>
        <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-200">AI · DEMO</span>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400">All candidates confirmed or dismissed.</div>
      ) : (
        <div className="space-y-2">
          {visible.map((candidate) => {
            const name = getName(candidate);
            const amount = candidate.suggested_amount_paise ?? candidate.historical_amount_max_paise;
            const done = confirmed.includes(name);
            const isPersonal = personal.includes(name);
            return (
              <div
                key={name}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                  done ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-[#002970] truncate">{name}</div>
                  <p className="mt-1 text-[10px] text-slate-500">{(interpretations[name]?.category_hint ?? candidate.category_hint)?.replace('possible_', 'Possible ') || 'Purpose unclear'} · {candidate.observations ?? candidate.occurrences_count ?? 'Several'} past payments</p>
                  {candidate.evidence_dates && candidate.evidence_dates.length > 0 && <p className="mt-1 text-[9px] text-slate-400">Seen: {candidate.evidence_dates.join(', ')}</p>}
                  {interpretations[name] && <p className="mt-1 rounded-lg border border-cyan-100 bg-cyan-50 p-2 text-[10px] leading-snug text-slate-700">Munim AI: {interpretations[name].explanation} <span className="font-semibold">({interpretations[name].confidence} confidence · confirm with merchant)</span></p>}
                  <button disabled={loadingInterpretation === name || !candidate.evidence_dates || candidate.evidence_dates.length < 3} onClick={() => interpret(candidate, name)} className="mt-1 text-[10px] font-bold text-[#007aa6] underline disabled:text-slate-400 disabled:no-underline">{loadingInterpretation === name ? 'Reviewing pattern…' : interpretations[name] ? 'Refresh AI interpretation' : 'Ask Munim AI what this pattern may be'}</button>
                  {interpretationError && loadingInterpretation !== name && <p className="mt-1 text-[9px] text-rose-700">{interpretationError}</p>}
                  <p className="mt-1 text-[9px] text-amber-700">Purpose needs your confirmation; repeating payments can be personal.</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black text-[#00baf2] font-mono">{amount == null ? '—' : `~${fmt(amount)}`}</span>
                    <span className="flex items-center gap-0.5 text-[9px] text-slate-500">
                      <Calendar className="w-2.5 h-2.5" />
                      {candidate.usual_day_name ?? (candidate.suggested_date ? new Date(`${candidate.suggested_date}T00:00:00`).toLocaleDateString() : '?')}
                    </span>
                  </div>
                </div>

                {isPersonal ? <span className="text-[10px] font-bold text-slate-500">Personal · excluded</span> : done ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 shrink-0">
                    <Check className="w-3.5 h-3.5" /> Done
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setPersonal((p) => [...p, name])} className="px-2 py-1 text-[10px] text-slate-500">Personal</button>
                    <button onClick={() => setDismissed((p) => [...p, name])} className="px-2.5 py-1 text-[10px] text-slate-500 hover:text-slate-800 rounded-lg font-medium">
                      {isHi ? 'नहीं' : 'Skip'}
                    </button>
                    <button onClick={() => handleStartConfirm(candidate)} className="px-3 py-1.5 text-[10px] font-bold bg-[#002970] text-white rounded-xl active:scale-95 flex items-center gap-1 shadow-xs hover:bg-[#001e54]">
                      <Check className="w-3 h-3 text-[#00baf2]" />{isHi ? 'हाँ' : 'Confirm'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-100 text-[#002970]">
                  <Sparkles className="w-4 h-4 text-[#00baf2]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#002970]">Confirm Recurring Bill</h4>
                  <p className="text-[10px] text-slate-500">Add to your active cash radar</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Payee / Supplier</label>
                <input
                  type="text"
                  value={confirmModal.name}
                  onChange={(e) => setConfirmModal({ ...confirmModal, name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00baf2]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Amount (₹)</label>
                <input
                  type="number"
                  value={confirmModal.amountRs}
                  onChange={(e) => setConfirmModal({ ...confirmModal, amountRs: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-sm font-black font-mono text-[#002970] focus:outline-none focus:ring-2 focus:ring-[#00baf2]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Next Due Date</label>
                <input
                  type="date"
                  value={confirmModal.dueDate}
                  onChange={(e) => setConfirmModal({ ...confirmModal, dueDate: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00baf2]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfirm}
                className="flex-1 py-2.5 rounded-xl bg-[#002970] text-white text-xs font-bold active:scale-95 transition-all shadow-md hover:bg-[#001e54]"
              >
                Save to Radar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
