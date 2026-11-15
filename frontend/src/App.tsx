import React, { useState, useEffect } from 'react';
import { MobileStatusBar } from './components/MobileStatusBar';
import { MobileHeader } from './components/MobileHeader';
import { MobileBottomNav, MobileTab } from './components/MobileBottomNav';
import { CashGapRadar } from './components/CashGapRadar';
import { JudgePlayground } from './components/JudgePlayground';
import { ActionAdvisor } from './components/ActionAdvisor';
import { CandidateObligations } from './components/CandidateObligations';
import { PaymentFlow } from './components/PaymentFlow';
import { MunimCopilot } from './components/MunimCopilot';
import { SettlementTracker } from './components/SettlementTracker';
import { api, DEMO_MERCHANTS } from './api';
import { ForecastOut, CandidateObligation, UnmatchedSettlement, Advice, Obligation } from './types';
import { mockForecast, mockAdvice, mockCandidates, mockUnmatched, mockObligations, defaultDueDate } from './mockData';
import { Smartphone, Monitor, Sparkles, X, PlusCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('radar');
  const [showDeviceFrame, setShowDeviceFrame] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string>(api.getMerchantId());
  const [switchingMerchant, setSwitchingMerchant] = useState(false);

  const [obligations, setObligations] = useState<Obligation[]>(mockObligations);
  const [baseForecast, setBaseForecast] = useState<ForecastOut>(mockForecast);
  const [currentForecast, setCurrentForecast] = useState<ForecastOut>(mockForecast);
  const [advice, setAdvice] = useState<Advice>(mockAdvice);
  const [candidates, setCandidates] = useState<CandidateObligation[]>(mockCandidates);
  const [unmatched, setUnmatched] = useState<UnmatchedSettlement[]>(mockUnmatched);
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [newPaymentDraft, setNewPaymentDraft] = useState({
    payee: '',
    amountRs: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });

  useEffect(() => {
    // Attempt connecting to live FastAPI backend on launch
    api.verifyAndConnect().then((res) => {
      setIsLive(res.success);
      if (res.success) {
        refreshAllData();
      }
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const refreshAllData = async () => {
    try {
      const obls = await api.getObligations();
      setObligations(obls);
      if (obls.length > 0) {
        const fc = await api.getForecast(obls[0].id);
        setBaseForecast(fc);
        setCurrentForecast(fc);
        const adv = await api.getAdvice(obls[0].id);
        setAdvice(adv);
      } else {
        setBaseForecast(mockForecast);
        setCurrentForecast(mockForecast);
        setAdvice(mockAdvice);
      }
      const cands = await api.getCandidates();
      setCandidates(cands);
      const unmatch = await api.getUnmatchedSettlements();
      setUnmatched(unmatch);
    } catch (e: any) {
      console.warn('API refresh error:', e);
    }
  };

  const handleMerchantChange = async (nextMerchantId: string) => {
    if (nextMerchantId === merchantId || switchingMerchant) return;
    const merchant = DEMO_MERCHANTS.find((item) => item.id === nextMerchantId);
    if (!merchant) return;
    setSwitchingMerchant(true);
    setObligations([]);
    setCandidates([]);
    setUnmatched([]);
    setBaseForecast(mockForecast);
    setCurrentForecast(mockForecast);
    setAdvice(mockAdvice);
    setActiveTab('radar');
    try {
      const result = await api.verifyAndConnect(nextMerchantId);
      if (!result.success) throw new Error(result.message);
      setMerchantId(nextMerchantId);
      setIsLive(true);
      await refreshAllData();
      showToast(`Showing ${merchant.name} demo data`);
    } catch (error) {
      showToast(`Could not switch shop: ${error instanceof Error ? error.message : 'please retry'}`);
      setMerchantId(api.getMerchantId());
      setIsLive(api.isLive());
      await refreshAllData();
    } finally {
      setSwitchingMerchant(false);
    }
  };

  const handleToggleLive = async () => {
    if (isLive) {
      api.disconnect();
      setIsLive(false);
    } else {
      const res = await api.verifyAndConnect();
      setIsLive(res.success);
      if (res.success) {
        await refreshAllData();
        showToast('✓ Connected to backend');
      } else {
        showToast(`⚠️ ${res.message}`);
      }
    }
  };

  const handleRunScenario = async (extraCashPaise: number, amountPaise?: number, dueDate?: string) => {
    const activeOblId = obligations[0]?.id || 'obl-gupta-101';
    const result = await api.runScenario(activeOblId, {
      extra_funds_paise: extraCashPaise,
      payment_amount_paise: amountPaise,
      due_date: dueDate,
    });
    setCurrentForecast(result);

    if (result.possible_gap_high_paise === 0) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.65 },
      });
      showToast('🎉 Gap Eliminated!');
    }
  };

  const handleResetScenario = () => {
    setCurrentForecast(baseForecast);
  };

  const handleConfirmCandidate = async (candidate: CandidateObligation) => {
    try {
      const created = await api.createObligation(
        candidate.payee ?? candidate.counterparty ?? 'Supplier',
        candidate.suggested_amount_paise ?? candidate.historical_amount_max_paise ?? 0,
        candidate.suggested_date || defaultDueDate
      );
      setObligations((prev) => [created, ...prev]);

      // Remove candidate from list
      setCandidates((prev) => prev.filter((c) => (c.payee ?? c.counterparty) !== (candidate.payee ?? candidate.counterparty)));

      // Refresh forecast for this newly confirmed obligation
      const fc = await api.getForecast(created.id);
      setBaseForecast(fc);
      setCurrentForecast(fc);

      showToast(`✓ Confirmed: ${created.payee} obligation persisted to backend.`);
    } catch (err: any) {
      showToast(`⚠️ Error creating obligation: ${err.message}`);
    }
  };

  const handleAddPayment = () => {
    setNewPaymentDraft({
      payee: '',
      amountRs: '',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });
    setAddPaymentModalOpen(true);
  };

  const handleSaveNewPayment = async () => {
    const { payee, amountRs, dueDate } = newPaymentDraft;
    if (!payee.trim()) {
      showToast('Enter payee name');
      return;
    }
    const amt = Number(amountRs.replace(/,/g, '').trim());
    if (!Number.isFinite(amt) || amt <= 0) {
      showToast('Enter a valid amount');
      return;
    }
    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      showToast('Enter a valid due date');
      return;
    }
    try {
      const created = await api.createObligation(payee.trim(), Math.round(amt * 100), dueDate);
      setObligations((previous) => [created, ...previous]);
      const refreshed = await api.getForecast(created.id);
      setBaseForecast(refreshed);
      setCurrentForecast(refreshed);
      setAddPaymentModalOpen(false);
      showToast(`Added ${created.payee} payment obligation.`);
    } catch (error) {
      showToast(`Could not add payment: ${error instanceof Error ? error.message : 'try again'}`);
    }
  };

  const handleQuickSolve = (action: 'cash' | 'split' | 'date') => {
    if (action === 'cash') {
      handleRunScenario(1700000);
      showToast('Applied +₹17,000 cash scenario');
    } else if (action === 'split') {
      handleRunScenario(0, Math.round(baseForecast.obligation_amount_paise / 2));
      showToast('Modeled 50% upfront payment');
    } else if (action === 'date') {
      const d = new Date(baseForecast.due_date);
      d.setDate(d.getDate() + 1);
      handleRunScenario(0, undefined, d.toISOString().split('T')[0]);
      showToast('Modeled 1-day payment shift');
    }
  };

  const handleSelectAction = (code: string) => {
    if (code === 'DECLARE_CASH' || code === 'VERIFY_COVERAGE') {
      setActiveTab('simulator');
      showToast('Test drawer cash or custom balances');
    } else if (code === 'SPLIT_PAYMENT' || code === 'SUPPLIER_SPLIT') {
      handleRunScenario(0, Math.round(baseForecast.obligation_amount_paise / 2));
      setActiveTab('simulator');
      showToast('Modeled 50% upfront split');
    } else if (code === 'PAYTM_EARLY_SETTLEMENT' || code === 'SETTLEMENT_REVIEW') {
      setActiveTab('actions');
    }
  };

  const handleDeclareExtra = (totalPaise: number) => {
    handleRunScenario(totalPaise);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 flex flex-col items-center justify-center p-0 sm:p-5 select-none font-sans">
      {/* Desktop Shell Top Bar */}
      <aside aria-label="Device view options" className="hidden sm:flex items-center justify-between w-full max-w-[430px] mb-2.5 px-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-white tracking-tight">Paytm Munim</span>
          <span className="text-[10px] text-[#00baf2] font-bold bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60">
            Mobile App View
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setShowDeviceFrame(true)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
              showDeviceFrame
                ? 'bg-[#002970] text-[#00baf2] shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone</span>
          </button>
          <button
            onClick={() => setShowDeviceFrame(false)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
              !showDeviceFrame
                ? 'bg-[#002970] text-[#00baf2] shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Full</span>
          </button>
        </div>
      </aside>

      {/* Mobile Device Frame Container */}
      <div
        className={`w-full bg-[#f4f7fb] flex flex-col transition-all duration-300 relative ${
          showDeviceFrame
            ? 'sm:max-w-[420px] sm:h-[880px] sm:rounded-[48px] sm:shadow-[0_25px_70px_-15px_rgba(0,186,242,0.25)] sm:border-[9px] sm:border-slate-800 overflow-hidden'
            : 'max-w-xl min-h-screen shadow-2xl'
        }`}
      >
        {/* Dynamic Island Notch for Phone Bezel */}
        {showDeviceFrame && (
          <div className="hidden sm:flex justify-center pt-2.5 pb-0 bg-[#002970] relative z-50">
            <div className="w-24 h-4 bg-black rounded-full flex items-center justify-end px-2">
              <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700"></div>
            </div>
          </div>
        )}

        {/* Mobile Status Bar */}
        <MobileStatusBar />

        {/* Mobile App Header */}
        <MobileHeader
          lang={lang}
          onLangChange={setLang}
          isLive={isLive}
          onToggleLive={handleToggleLive}
          merchantId={merchantId}
          onMerchantChange={handleMerchantChange}
          balancePaise={currentForecast.balance_paise}
        />

        {/* Floating Notification Toast */}
        {toastMessage && (
          <div className="absolute top-20 left-4 right-4 z-50 animate-bounce">
            <div className="bg-[#002970] text-white px-3.5 py-2 rounded-2xl shadow-paytm-lg border border-[#00baf2]/60 text-xs font-bold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00baf2]" />
                <span>{toastMessage}</span>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Mobile Screen Content */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 no-scrollbar pb-8">
          {activeTab === 'radar' && (
            <>
              <CashGapRadar
                forecast={currentForecast}
                lang={lang}
                onOpenPlayground={() => setActiveTab('simulator')}
                onQuickSolve={handleQuickSolve}
                onAddPayment={handleAddPayment}
                onDeclareExtra={handleDeclareExtra}
              />
              <ActionAdvisor
                advice={advice}
                lang={lang}
                onSelectAction={handleSelectAction}
              />
            </>
          )}

          {activeTab === 'actions' && (
            <>
              <section className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                <h1 className="text-lg font-extrabold text-[#002970]">Operations</h1>
                <p className="mt-1 text-sm text-slate-600">Review payment patterns Munim found and check settlement exceptions. You confirm every decision.</p>
              </section>
              <CandidateObligations
                candidates={candidates}
                lang={lang}
                onConfirmCandidate={handleConfirmCandidate}
                onInterpret={(candidate) => api.interpretDebitPattern(candidate)}
              />
              <SettlementTracker unmatched={unmatched} lang={lang} />
            </>
          )}

          {activeTab === 'simulator' && (
            <JudgePlayground
              baseForecast={baseForecast}
              currentForecast={currentForecast}
              onRunScenario={handleRunScenario}
              onReset={handleResetScenario}
              lang={lang}
              onBack={() => setActiveTab('radar')}
            />
          )}

          {activeTab === 'assistant' && <MunimCopilot payee={currentForecast.payee} obligationId={currentForecast.obligation_id} onAsk={(message, obligationId) => api.askMunim(message, obligationId)} />}

          {activeTab === 'pay' && <PaymentFlow obligations={obligations} parseDraft={(text) => api.parsePaymentDraft(text)} parseVoice={(audio) => api.parseVoicePaymentDraft(audio)} onAdd={async (payee, amountPaise, dueDate) => { const created = await api.createObligation(payee, amountPaise, dueDate); setObligations(prev => [created, ...prev]); const forecast = await api.getForecast(created.id); setBaseForecast(forecast); setCurrentForecast(forecast); }} />}

        </main>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          candidateCount={candidates.length}
          lang={lang}
        />

        {/* Add Payment In-App Modal */}
        {addPaymentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-100 text-[#002970]">
                    <PlusCircle className="w-4 h-4 text-[#002970]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#002970]">Add Upcoming Payment</h4>
                    <p className="text-[10px] text-slate-500">Track a new supplier obligation</p>
                  </div>
                </div>
                <button
                  onClick={() => setAddPaymentModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Supplier / Payee Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh FMCG Distributors"
                    value={newPaymentDraft.payee}
                    onChange={(e) => setNewPaymentDraft({ ...newPaymentDraft, payee: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00baf2]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 25000"
                    value={newPaymentDraft.amountRs}
                    onChange={(e) => setNewPaymentDraft({ ...newPaymentDraft, amountRs: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-sm font-black font-mono text-[#002970] focus:outline-none focus:ring-2 focus:ring-[#00baf2]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Due Date</label>
                  <input
                    type="date"
                    value={newPaymentDraft.dueDate}
                    onChange={(e) => setNewPaymentDraft({ ...newPaymentDraft, dueDate: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00baf2]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setAddPaymentModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewPayment}
                  className="flex-1 py-2.5 rounded-xl bg-[#002970] text-white text-xs font-bold active:scale-95 transition-all shadow-md hover:bg-[#001e54]"
                >
                  Add to Radar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
