import React, { useState } from 'react';
import { ArrowUp, Bot, Sparkles, User } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; text: string };
type Props = { payee: string; obligationId: string; onAsk: (message: string, obligationId: string) => Promise<{answer: string; grounded: boolean}> };
const prompts = ['Why is a cash gap showing?', 'What do I need to pay soon?', 'Explain the recurring debit suggestions'];

export const MunimCopilot: React.FC<Props> = ({ payee, obligationId, onAsk }) => {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: `Hi, I’m Munim. Ask me about ${payee}, your cash forecast, or a recurring debit. I’ll answer using the data shown in your account.` }]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const send = async (value = text) => {
    const question = value.trim();
    if (!question || busy) return;
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setText(''); setBusy(true); setError('');
    try {
      const result = await onAsk(question, obligationId);
      setMessages(prev => [...prev, { role: 'assistant', text: result.answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach Munim AI.');
    } finally { setBusy(false); }
  };
  return <section className="flex min-h-[65vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-paytm">
    <header className="bg-gradient-to-r from-[#002970] to-[#00428f] p-4 text-white"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15"><Bot className="h-5 w-5 text-[#00baf2]" /></span><div><h2 className="text-base font-extrabold">Ask Munim</h2><p className="text-[10px] text-cyan-100">Your AI business copilot · grounded in your account data</p></div><span className="ml-auto flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[9px] font-bold"><Sparkles className="h-3 w-3 text-[#00baf2]"/> AI</span></div></header>
    <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4">{messages.map((message, i) => <div key={i} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>{message.role === 'assistant' && <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#002970] text-[#00baf2]"><Bot className="h-4 w-4"/></span>}<p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${message.role === 'user' ? 'rounded-br-sm bg-[#002970] text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700 shadow-sm'}`}>{message.text}</p>{message.role === 'user' && <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-100 text-[#002970]"><User className="h-4 w-4"/></span>}</div>)}{busy && <div className="ml-9 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-500">Munim is checking the forecast and payment history…</div>}{error && <p className="ml-9 text-[10px] text-rose-700">{error}</p>}</div>
    <div className="border-t border-slate-200 bg-white p-3"><p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-slate-500">Try asking</p><div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">{prompts.map(prompt => <button key={prompt} onClick={() => send(prompt)} disabled={busy} className="shrink-0 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[9px] font-semibold text-[#002970] disabled:opacity-50">{prompt}</button>)}</div><form onSubmit={e => {e.preventDefault(); void send();}} className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 focus-within:border-[#00baf2] focus-within:ring-2 focus-within:ring-cyan-100"><textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={e => {if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); void send();}}} placeholder="Ask about your cash, payments, or debits…" rows={2} className="max-h-24 min-h-10 flex-1 resize-y bg-transparent px-1 py-1 text-xs outline-none"/><button aria-label="Send to Munim" disabled={!text.trim() || busy} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#002970] text-white disabled:bg-slate-300"><ArrowUp className="h-4 w-4"/></button></form><p className="mt-2 text-[9px] leading-snug text-slate-400">Munim explains available data and estimates. Verify important details; AI does not confirm bills or make payments.</p></div>
  </section>;
};
