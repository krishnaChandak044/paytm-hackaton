import React, { useState, useEffect } from 'react';
import { Wifi, Battery } from 'lucide-react';

export const MobileStatusBar: React.FC = () => {
  const [time, setTime] = useState('12:04');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#002970] text-white px-5 pt-3 pb-1 flex justify-between items-center text-xs font-semibold select-none">
      <span className="tracking-tight text-white/90">{time}</span>
      <div className="flex items-center gap-1.5 text-white/80">
        <span className="text-[10px] font-bold">5G</span>
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center gap-0.5">
          <Battery className="w-4 h-4 fill-white" />
        </div>
      </div>
    </div>
  );
};

