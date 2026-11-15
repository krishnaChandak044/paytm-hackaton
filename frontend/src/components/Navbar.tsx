import React from 'react';
import { Store, CheckCircle2, Server, Database } from 'lucide-react';
import { SoundboxPlayer } from './SoundboxPlayer';

interface NavbarProps {
  lang: 'en' | 'hi';
  onLangChange: (lang: 'en' | 'hi') => void;
  isLive: boolean;
  onToggleLive: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onLangChange,
  isLive,
  onToggleLive,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#002970] text-white shadow-md border-b border-[#001e54]">
      {/* Top Banner */}
      <div className="bg-[#001f54] text-[11px] text-cyan-200/90 py-1 px-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="bg-[#00baf2] text-[#002970] font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
            Prototype
          </span>
          <span>Paytm for Business AI Concept · Evidence-Bounded Cash Flow Radar</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleLive}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-[11px]"
            title="Toggle between Live FastAPI Backend and Standalone Client"
          >
            {isLive ? (
              <>
                <Server className="w-3 h-3 text-green-400" />
                <span className="text-green-300 font-medium">Live FastAPI Backend (Port 8001)</span>
              </>
            ) : (
              <>
                <Database className="w-3 h-3 text-cyan-300" />
                <span className="text-cyan-200">Interactive Demo Engine</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Paytm Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-baseline tracking-tight">
            <span className="text-2xl font-black text-white tracking-tighter">Pay</span>
            <span className="text-2xl font-black text-[#00baf2] tracking-tighter">tm</span>
            <div className="ml-2 pl-2 border-l border-white/20 flex flex-col justify-center">
              <span className="text-xs font-bold text-white tracking-wider uppercase leading-none">
                Munim
              </span>
              <span className="text-[10px] text-cyan-300 font-medium leading-tight">
                Cash Partner
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-white/10 text-white/90 px-2.5 py-1 rounded-full text-xs font-medium">
            <Store className="w-3.5 h-3.5 text-cyan-300" />
            <span>Sharma General Store</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00baf2]" />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Soundbox Broadcast Trigger */}
          <SoundboxPlayer lang={lang} />

          {/* Language Switcher */}
          <div className="flex items-center bg-[#001e4d] p-0.5 rounded-full border border-white/15">
            <button
              onClick={() => onLangChange('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
                lang === 'en'
                  ? 'bg-[#00baf2] text-[#002970] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLangChange('hi')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
                lang === 'hi'
                  ? 'bg-[#00baf2] text-[#002970] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
