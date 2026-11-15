import React, { useRef, useState } from 'react';
import { Obligation } from '../types';

type Props = { obligations: Obligation[]; onAdd: (payee: string, amountPaise: number, dueDate: string) => Promise<void>; parseVoice: (audio: Blob) => Promise<{transcript: string; payee?: string | null; amount_paise?: number | null; due_date?: string | null; needs_clarification: boolean; clarification_question?: string | null}>; parseDraft: (text: string) => Promise<{payee?: string | null; amount_paise?: number | null; due_date?: string | null; needs_clarification: boolean; clarification_question?: string | null}> };

export const PaymentFlow: React.FC<Props> = ({ obligations, onAdd, parseDraft, parseVoice }) => {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [draft, setDraft] = useState<{payee: string; amount: string; date: string} | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Obligation | null>(null);
  const [approved, setApproved] = useState(false);
  const money = (n: number) => `₹${(n / 100).toLocaleString('en-IN')}`;
  const prepare = async () => {
    if (!text.trim()) return;
    setBusy(true); setMessage('');
    try {
      const result = await parseDraft(text.trim());
      setDraft({payee: result.payee ?? '', amount: result.amount_paise ? String(result.amount_paise / 100) : '', date: result.due_date ?? ''});
      if (result.needs_clarification) setMessage(result.clarification_question || 'Please fill the missing details before confirming.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'AI unavailable. Enter details manually.'); setDraft({payee: '', amount: '', date: ''}); }
    finally { setBusy(false); }
  };
  const toggleRecording = async () => {
    if (recorder.current && recording) { recorder.current.stop(); setRecording(false); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setMessage('Microphone recording is not supported here. Type the payment instead.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      const next = new MediaRecorder(stream); recorder.current = next; audioChunks.current = [];
      next.ondataavailable = event => { if (event.data.size) audioChunks.current.push(event.data); };
      next.onstop = async () => { stream.getTracks().forEach(track => track.stop()); setBusy(true); try { const result = await parseVoice(new Blob(audioChunks.current, {type:next.mimeType || 'audio/webm'})); setText(result.transcript); setDraft({payee:result.payee ?? '', amount:result.amount_paise ? String(result.amount_paise / 100) : '', date:result.due_date ?? ''}); setMessage(result.needs_clarification ? result.clarification_question || 'Complete the missing details.' : 'Review the transcript and draft before saving.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Voice unavailable. Type instead.'); } finally { setBusy(false); } };
      next.start(); setRecording(true); setMessage('Recording… tap Stop when finished. Keep it under 30 seconds.');
      window.setTimeout(() => { if (next.state === 'recording') { next.stop(); setRecording(false); } }, 29000);
    } catch { setMessage('Microphone access unavailable. Type the payment instead.'); }
  };
  const save = async () => {
    if (!draft?.payee.trim() || !Number.isFinite(Number(draft.amount)) || Number(draft.amount) <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) { setMessage('Enter a payee, positive amount, and date in YYYY-MM-DD format.'); return; }
    setBusy(true);
    try { await onAdd(draft.payee.trim(), Math.round(Number(draft.amount) * 100), draft.date); setDraft(null); setText(''); setMessage('Payment added after your confirmation.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not add payment.'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-3">
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-paytm"><div className="flex items-center justify-between"><h2 className="text-base font-extrabold text-[#002970]">Tell Munim what’s due</h2><span className="rounded-full bg-cyan-100 px-2 py-1 text-[9px] font-bold text-[#002970]">SARVAM AI</span></div><p className="mt-1 text-[11px] text-slate-500">Type in Hindi, Hinglish, or English. AI prepares a draft for your review.</p><textarea value={text} onChange={e => setText(e.target.value)} placeholder="Gupta Traders ko 18 tareekh ko ₹12,000 dene hain" className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm" /><div className="flex flex-wrap gap-2"><button disabled={busy} onClick={toggleRecording} className="rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-bold text-[#002970]">{recording ? "Stop recording" : "🎙 Speak"}</button><button disabled={busy} onClick={prepare} className="rounded-xl bg-[#002970] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? 'Preparing…' : 'Prepare with AI'}</button><button onClick={() => setDraft({payee:'', amount:'', date:''})} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">Enter manually</button></div>{message && <p className="mt-2 text-xs text-amber-800">{message}</p>}{draft && <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold text-[#002970]">Review before adding</p><input aria-label="Payee" placeholder="Payee" value={draft.payee} onChange={e => setDraft({...draft,payee:e.target.value})} className="w-full rounded-lg border p-2 text-xs"/><input aria-label="Amount in rupees" placeholder="Amount in rupees" value={draft.amount} onChange={e => setDraft({...draft,amount:e.target.value})} className="w-full rounded-lg border p-2 text-xs"/><input aria-label="Due date" type="date" value={draft.date} onChange={e => setDraft({...draft,date:e.target.value})} className="w-full rounded-lg border p-2 text-xs"/><button disabled={busy} onClick={save} className="rounded-lg bg-[#002970] px-3 py-2 text-xs font-bold text-white">Confirm & add</button></div>}</section>
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-paytm"><h2 className="text-base font-extrabold text-[#002970]">Confirmed payments</h2><p className="mt-1 text-[11px] text-slate-500">Paytm payment handoff is simulated in this hackathon demo.</p><div className="mt-3 space-y-2">{obligations.filter(x => x.status === 'confirmed').map(x => <div key={x.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"><div><p className="text-xs font-bold text-slate-800">{x.payee}</p><p className="text-[10px] text-slate-500">{money(x.amount_paise)} · Due {x.due_date}</p></div><button onClick={() => {setSelected(x);setApproved(false);}} className="shrink-0 rounded-lg bg-[#00baf2] px-3 py-2 text-[10px] font-extrabold text-[#002970]">Pay with Paytm</button></div>)}</div></section>
    {selected && <div role="dialog" aria-modal="true" aria-label="Simulated Paytm payment" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4"><div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"><span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-bold text-amber-900">SIMULATED PAYMENT</span><h3 className="mt-3 text-lg font-extrabold text-[#002970]">Review payment</h3><p className="mt-2 text-sm">{selected.payee} · {money(selected.amount_paise)}</p><p className="mt-1 text-xs text-slate-500">No money will move. This demo records a simulated result only.</p>{approved ? <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800">Simulation complete. In production, a verified Paytm result must confirm payment.</p> : null}<div className="mt-4 flex gap-2"><button onClick={() => setSelected(null)} className="rounded-xl border px-3 py-2 text-xs font-bold">Close</button>{!approved && <button onClick={() => {setApproved(true);}} className="rounded-xl bg-[#002970] px-3 py-2 text-xs font-bold text-white">Approve demo payment</button>}</div></div></div>}
  </div>;
};
