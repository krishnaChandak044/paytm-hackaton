import React from 'react';
import { ShieldCheck, Bot, Wallet, ClipboardList } from 'lucide-react';

export type MobileTab = 'radar' | 'actions' | 'simulator' | 'assistant' | 'candidates' | 'settlement' | 'pay';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  candidateCount: number;
  lang: 'en' | 'hi';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  candidateCount,
  lang,
}) => {
  const isHi = lang === 'hi';

  const tabs = [
    {
      id: 'radar' as MobileTab,
      label: isHi ? 'कैश रडार' : 'Radar',
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: 'assistant' as MobileTab,
      label: isHi ? 'मुनीम AI' : 'Ask AI',
      icon: Bot,
      highlight: true,
      badge: null,
    },
    {
      id: 'actions' as MobileTab,
      label: isHi ? 'काम' : 'Operations',
      icon: ClipboardList,
      badge: candidateCount > 0 ? String(candidateCount) : null,
    },
    { id: 'pay' as MobileTab, label: isHi ? 'भुगतान' : 'Pay', icon: Wallet, badge: null },
  ];

  return (
    <nav className="sticky bottom-0 z-50 bg-white border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,41,112,0.06)] px-2 py-1.5 pb-2">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center -mt-4 relative group"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-tr from-[#002970] to-[#00baf2] text-white ring-2 ring-[#00baf2] shadow-[#00baf2]/30'
                      : 'bg-[#002970] text-[#00baf2] hover:bg-[#001e54]'
                  }`}
                >
                  <Icon className="w-5 h-5 font-bold" />
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 tracking-tight ${
                    isActive ? 'text-[#002970]' : 'text-slate-500'
                  }`}
                >
                  {tab.label}
                </span>
                <span className="absolute -top-1 right-0 text-[8px] font-black bg-[#00baf2] text-[#002970] px-1 rounded-full uppercase">
                  AI
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
                isActive ? 'text-[#002970]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-[#002970]' : 'text-slate-400'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? 'font-bold text-[#002970]' : 'font-medium text-slate-500'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#00baf2] mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
      {/* iOS style home indicator bar */}
      <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto mt-1.5 opacity-60"></div>
    </nav>
  );
};

