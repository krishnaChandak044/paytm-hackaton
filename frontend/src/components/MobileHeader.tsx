import React from 'react';
import { CheckCircle2, ChevronDown, QrCode, Store } from 'lucide-react';
import { SoundboxPlayer } from './SoundboxPlayer';
import { DEMO_MERCHANTS } from '../api';

interface MobileHeaderProps {
  lang: 'en' | 'hi';
  onLangChange: (lang: 'en' | 'hi') => void;
  isLive: boolean;
  onToggleLive: () => void;
  merchantId: string;
  onMerchantChange: (merchantId: string) => void;
  balancePaise?: number | null;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  lang,
  onLangChange,
  isLive,
  onToggleLive,
  merchantId,
  onMerchantChange,
  balancePaise,
}) => {
  const merchant = DEMO_MERCHANTS.find((item) => item.id === merchantId) ?? DEMO_MERCHANTS[0];
  const formattedBalance = balancePaise == null
    ? 'Not connected'
    : `₹${Math.round(balancePaise / 100).toLocaleString('en-IN')}`;
  return (
    <div className="bg-[#002970] text-white px-4 pt-1.5 pb-3.5 select-none">
      {/* Top row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#001e54] to-[#0041a8] flex items-center justify-center border-2 border-[#00baf2]/60 text-white font-black text-sm">
              {merchant.name.charAt(0)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 bg-[#00baf2] rounded-full p-0.5 border border-[#002970]">
              <CheckCircle2 className="w-2.5 h-2.5 text-[#002970]" />
            </span>
          </div>
          <div>
            <label className="relative flex items-center gap-1 text-xs font-extrabold text-white leading-none">
              <Store className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <select aria-label="Choose demo shop" value={merchantId} onChange={(event) => onMerchantChange(event.target.value)} className="max-w-[172px] appearance-none bg-transparent pr-4 text-xs font-extrabold text-white outline-none cursor-pointer">
                {DEMO_MERCHANTS.map((item) => <option className="text-slate-900" key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-cyan-300 absolute right-0 pointer-events-none" />
            </label>
            <div className="mt-0.5 flex items-center gap-1 text-[9px] text-cyan-300 font-medium">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
              <span>{isLive ? 'Connected demo data' : 'Sample preview'}</span>
              <button onClick={onToggleLive} className="ml-1 underline underline-offset-2" title="Reconnect demo data">{isLive ? 'Refresh' : 'Connect'}</button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#001e4d] p-0.5 rounded-full border border-white/15">
            <button
              onClick={() => onLangChange('en')}
              className={`px-2 py-0.5 text-[10px] font-black rounded-full transition-all ${
                lang === 'en' ? 'bg-[#00baf2] text-[#002970]' : 'text-white/60 hover:text-white'
              }`}
            >EN</button>
            <button
              onClick={() => onLangChange('hi')}
              className={`px-2 py-0.5 text-[10px] font-black rounded-full transition-all ${
                lang === 'hi' ? 'bg-[#00baf2] text-[#002970]' : 'text-white/60 hover:text-white'
              }`}
            >हिं</button>
          </div>
          <SoundboxPlayer lang={lang} />
        </div>
      </div>

      {/* Verified scope shown clearly; no fabricated daily collection metric. */}
      <div className="bg-gradient-to-r from-[#003882] to-[#001f54] rounded-2xl px-3.5 py-2.5 border border-white/10 flex items-center justify-between gap-3">
        <div className="text-right">
          <div className="text-[9px] text-cyan-300 uppercase tracking-wider font-bold mb-0.5">
            {lang === 'hi' ? 'बैंक बैलेंस' : 'Bank'}
          </div>
          <div className="text-base font-black text-cyan-200 leading-none">{formattedBalance}</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-left">
          <div className="text-[9px] text-cyan-300 uppercase tracking-wider font-bold mb-0.5">{lang === 'hi' ? 'डेटा मोड' : 'Data mode'}</div>
          <div className="text-xs font-bold text-white">Synthetic demo</div>
        </div>
        <QrCode className="w-4 h-4 text-cyan-300" />
      </div>
    </div>
  );
};
