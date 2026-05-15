import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * SOSButton — large, accessible emergency trigger button.
 * Requires 2-second hold to prevent accidental triggers.
 */
export default function SOSButton({ onTrigger, triggered, disabled }) {
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const HOLD_DURATION = 2000; // 2 seconds

  useEffect(() => {
    if (!holding) { setHoldProgress(0); return; }
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setHolding(false);
        setHoldProgress(0);
        onTrigger?.();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [holding, onTrigger]);

  const handleStart = (e) => {
    e.preventDefault();
    if (!disabled) setHolding(true);
  };
  const handleEnd = () => {
    setHolding(false);
    setHoldProgress(0);
  };

  const circumference = 2 * Math.PI * 56; // r=56

  if (triggered) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-36 h-36 rounded-full bg-green-600 flex items-center justify-center shadow-lg shadow-green-900 animate-pulse">
          <div className="text-center">
            <CheckCircle size={40} className="text-white mx-auto"/>
            <p className="text-white font-bold text-sm mt-1">SOS Sent!</p>
          </div>
        </div>
        <p className="text-green-400 text-xs">Alerting contacts + calling...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" onMouseDown={handleStart} onMouseUp={handleEnd}
           onTouchStart={handleStart} onTouchEnd={handleEnd}>
        {/* Progress ring */}
        <svg className="absolute inset-0 w-36 h-36 -rotate-90" viewBox="0 0 144 144">
          <circle cx="72" cy="72" r="56" fill="none" stroke="#374151" strokeWidth="6"/>
          {holding && (
            <circle cx="72" cy="72" r="56" fill="none" stroke="#ef4444" strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (holdProgress / 100) * circumference}
              strokeLinecap="round" style={{transition:'stroke-dashoffset 0.05s linear'}}/>
          )}
        </svg>

        <button
          disabled={disabled}
          className={`w-36 h-36 rounded-full flex items-center justify-center select-none
            shadow-2xl transition-all duration-150 active:scale-95
            ${disabled ? 'bg-gray-700 cursor-not-allowed' : holding ? 'bg-red-800 shadow-red-900' : 'bg-red-600 hover:bg-red-700 shadow-red-900 cursor-pointer'}
          `}
          style={{ boxShadow: disabled ? '' : '0 0 40px rgba(239,68,68,0.4), 0 8px 32px rgba(0,0,0,0.5)' }}>
          <div className="text-center pointer-events-none">
            <AlertTriangle size={44} className={`text-white mx-auto ${holding ? 'animate-bounce' : ''}`}/>
            <p className="text-white font-black text-lg tracking-widest mt-1">SOS</p>
            <p className="text-red-200 text-xs">{holding ? `${Math.round(holdProgress)}%` : 'Hold 2s'}</p>
          </div>
        </button>
      </div>
      <p className="text-gray-500 text-xs">
        {disabled ? 'Enable location to use SOS' : 'Hold for 2 seconds to trigger emergency'}
      </p>
    </div>
  );
}
