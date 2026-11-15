import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

interface SoundboxPlayerProps {
  lang: 'en' | 'hi';
  isBridgeActive?: boolean;
}

export const SoundboxPlayer: React.FC<SoundboxPlayerProps> = ({ lang, isBridgeActive }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const speakAlert = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis not supported on this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    const textHindi = isBridgeActive
      ? 'पेटीएम मुनीम सूचना: तीन दिन का ब्रिज लोन स्वीकृत। बैंक खाते में पंद्रह हज़ार रुपये जमा। गुप्ता ट्रेडर्स का भुगतान अब सुरक्षित है।'
      : 'पेटीएम मुनीम सूचना: गुरुवार को गुप्ता ट्रेडर्स का अड़तीस हज़ार रुपये का भुगतान देय है। अनुमानित नौ हज़ार से सत्रह हज़ार रुपये की कमी हो सकती है। कृपया मुनीम ऐप देखें।';
    const textEnglish = isBridgeActive
      ? 'Paytm Munim Alert: 3-day micro-bridge loan approved and credited. Payment to Gupta Traders is now fully safe.'
      : 'Paytm Munim Alert: Gupta Traders payment of 38,000 rupees is due this Thursday. Anticipated shortfall of 9,000 to 17,000 rupees. Check Munim app to review options.';

    const utterance = new SpeechSynthesisUtterance(lang === 'hi' ? textHindi : textEnglish);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    setIsPlaying(true);

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopAlert = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={isPlaying ? stopAlert : speakAlert}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs active:scale-95 ${
          isPlaying
            ? 'bg-amber-500 text-white ring-2 ring-amber-300 animate-pulse'
            : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
        }`}
        title="Simulate Paytm Soundbox Voice Broadcast"
      >
        {isPlaying ? (
          <>
            <VolumeX className="w-3.5 h-3.5 text-white" />
            <span>Stop</span>
            {/* Animated Equalizer Waveform */}
            <div className="flex items-end gap-0.5 h-3 ml-0.5">
              <span className="w-0.5 bg-white rounded-full animate-[bounce_0.6s_infinite_100ms] h-2"></span>
              <span className="w-0.5 bg-white rounded-full animate-[bounce_0.6s_infinite_300ms] h-3"></span>
              <span className="w-0.5 bg-white rounded-full animate-[bounce_0.6s_infinite_200ms] h-1.5"></span>
            </div>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-[#00baf2]" />
            <span>Soundbox</span>
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00baf2]"></span>
            </span>
          </>
        )}
      </button>

      {isPlaying && (
        <span className="hidden sm:inline-flex text-[10px] text-cyan-200 items-center gap-1 font-medium">
          <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
          {lang === 'hi' ? 'बोल रहा है...' : 'Announcing...'}
        </span>
      )}
    </div>
  );
};
