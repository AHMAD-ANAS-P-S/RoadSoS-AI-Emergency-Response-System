import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const HOLD_DURATION = 2000;

export default function SOSButton({ onTrigger, triggered, disabled }) {
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

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
    }, 30);
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

  const size = 160;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (holdProgress / 100) * circumference;

  if (triggered) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 0 0 rgba(22,163,74,0.4), 0 0 60px rgba(22,163,74,0.5)',
          animation: 'sos-pulse 1.5s ease-in-out infinite',
        }}>
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={44} color="#fff" style={{ display: 'block', margin: '0 auto' }} />
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginTop: 4 }}>SOS Sent!</p>
          </div>
        </div>
        <div style={{
          background: 'rgba(22,163,74,0.12)',
          border: '1px solid rgba(22,163,74,0.3)',
          borderRadius: 12,
          padding: '6px 16px',
          color: '#4ade80',
          fontSize: 12,
          fontWeight: 600,
        }}>
          ✅ Alerting contacts + emergency services…
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div
        style={{ position: 'relative', width: size, height: size, userSelect: 'none' }}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
      >
        {/* SVG ring */}
        <svg
          style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
          width={size} height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={6}
          />
          {/* Progress */}
          {holding && (
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke="#ef4444"
              strokeWidth={6}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.03s linear', filter: 'drop-shadow(0 0 8px #ef4444)' }}
            />
          )}
          {/* Outer glow ring (idle only) */}
          {!holding && !disabled && (
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke="rgba(239,68,68,0.2)"
              strokeWidth={1.5}
              strokeDasharray="4 6"
            />
          )}
        </svg>

        {/* Main button */}
        <button
          disabled={disabled}
          style={{
            position: 'absolute',
            inset: 12,
            borderRadius: '50%',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            background: disabled
              ? 'linear-gradient(135deg, #374151, #1f2937)'
              : holding
                ? 'linear-gradient(135deg, #b91c1c, #7f1d1d)'
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            transition: 'background 0.2s, transform 0.15s',
            transform: holding ? 'scale(0.95)' : 'scale(1)',
            boxShadow: disabled
              ? 'none'
              : holding
                ? '0 0 0 0 rgba(239,68,68,0.6), 0 0 60px rgba(239,68,68,0.4), 0 12px 40px rgba(0,0,0,0.6)'
                : '0 0 0 0 rgba(239,68,68,0.35), 0 0 40px rgba(239,68,68,0.3), 0 12px 40px rgba(0,0,0,0.6)',
            animation: disabled ? 'none' : holding ? 'sos-holding 0.6s ease-in-out infinite' : 'sos-idle 2.5s ease-in-out infinite',
            minHeight: 'unset',
            minWidth: 'unset',
          }}
        >
          <AlertTriangle
            size={40}
            color={disabled ? 'rgba(255,255,255,0.3)' : '#fff'}
            style={{ animation: holding ? 'none' : 'none' }}
          />
          <span style={{
            color: disabled ? 'rgba(255,255,255,0.3)' : '#fff',
            fontWeight: 900,
            fontSize: 20,
            letterSpacing: '0.12em',
            fontFamily: "'Outfit', sans-serif",
          }}>
            SOS
          </span>
          <span style={{
            color: disabled ? 'rgba(255,255,255,0.2)' : holding ? '#fca5a5' : 'rgba(255,255,255,0.7)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.03em',
          }}>
            {holding ? `${Math.round(holdProgress)}%` : 'Hold 2s'}
          </span>
        </button>
      </div>

      {/* Hint text */}
      <p style={{
        fontSize: 12,
        color: disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        maxWidth: 220,
        lineHeight: 1.5,
      }}>
        {disabled
          ? '⚠️ Enable location to activate SOS'
          : '🔴 Press & hold 2 seconds to trigger emergency alert'}
      </p>
    </div>
  );
}
