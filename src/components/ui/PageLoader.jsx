import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import AppLogo from './AppLogo';

/**
 * Enhanced Top Progress Bar with smooth progress animation & glowing trailing edge.
 */
export function TopProgressBar({ progress = 75 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3.5,
        zIndex: 9999,
        background: 'rgba(17, 100, 106, 0.15)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'linear-gradient(90deg, #11646a 0%, #0d4f4e 35%, #e88d22 70%, #ffaa33 100%)',
          boxShadow: '0 0 14px rgba(232, 141, 34, 0.8), 0 0 4px #11646a',
          borderRadius: '0 2px 2px 0',
        }}
      />
    </div>
  );
}

/**
 * Premium Full-Page / Container Loader with dual orbit rings, glassmorphism badge,
 * smooth progress timer, and branded Saabq logo & typography.
 *
 * @param {object} props
 * @param {string} [props.message] - Optional custom loading text
 * @param {boolean} [props.fullScreen] - Whether to occupy fixed viewport
 * @param {number} [props.minDurationMs] - Minimum duration to stay smoothly visible (default 600ms)
 */
export default function PageLoader({ message, fullScreen = false, minDurationMs = 1400 }) {
  const { t, isRTL } = useLanguage();
  const [progress, setProgress] = useState(15);

  // Smooth progress bar simulation for graceful page transition
  useEffect(() => {
    const t1 = setTimeout(() => setProgress(40), 250);
    const t2 = setTimeout(() => setProgress(70), 650);
    const t3 = setTimeout(() => setProgress(90), 1050);
    const t4 = setTimeout(() => setProgress(100), minDurationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [minDurationMs]);

  const defaultText = isRTL ? 'جاري تجهيز الصفحة...' : 'Preparing page...';
  const loadingText = message || defaultText;
  const subtitle = isRTL ? 'منصة الجدولة وإدارة المواعيد الذكية' : 'Smart Scheduling Platform';

  const containerStyle = fullScreen
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--background, #0b1324)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(20px)',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        width: '100%',
        padding: '70px 20px',
      };

  return (
    <div style={containerStyle} role="status" aria-label={loadingText}>
      <TopProgressBar progress={progress} />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
        }}
      >
        {/* Dual Orbit Glowing Logo Badge */}
        <div style={{ position: 'relative', width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Outer Ring 1: Conic Gradient Clockwise Orbit */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              padding: 3,
              background: 'conic-gradient(from 0deg, var(--primary), var(--secondary), #1739a5, var(--primary))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              animation: 'spin-ring 1.8s linear infinite',
              filter: 'drop-shadow(0 0 8px rgba(17, 100, 106, 0.4))',
            }}
          />

          {/* Outer Ring 2: Counter-Clockwise Dotted Accent Ring */}
          <div
            style={{
              position: 'absolute',
              inset: 7,
              borderRadius: '50%',
              border: '2px dashed var(--secondary)',
              opacity: 0.7,
              animation: 'spin-ring-reverse 2.4s linear infinite',
            }}
          />

          {/* Inner Pulsing Glow Aura */}
          <div
            style={{
              position: 'absolute',
              inset: 12,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(17, 100, 106, 0.2) 0%, rgba(232, 141, 34, 0.2) 100%)',
              boxShadow: '0 0 32px rgba(17, 100, 106, 0.4), inset 0 0 16px rgba(232, 141, 34, 0.2)',
              animation: 'pulse-glow 1.8s ease-in-out infinite alternate',
            }}
          />

          {/* Center Glassmorphism Logo Badge */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'var(--surface, #ffffff)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12), inset 0 0 0 1px var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 10,
            }}
          >
            <AppLogo height={44} showText={false} />
          </div>
        </div>

        {/* Saabq App Name Branding, Loading Text & Animated Dots */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ transform: 'scale(1.15)', transformOrigin: 'center', marginBottom: 4 }}>
            <AppLogo height={28} showText={true} />
          </div>

          <p
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              letterSpacing: '0.04em',
              margin: 0,
              opacity: 0.85,
            }}
          >
            {subtitle}
          </p>

          {/* Status Badge & Pulsing Dots */}
          <div
            style={{
              marginTop: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 16px',
              borderRadius: 'var(--radius-full, 9999px)',
              background: 'var(--primary-subtle, rgba(17, 100, 106, 0.08))',
              border: '1px solid var(--border-light, rgba(17, 100, 106, 0.15))',
            }}
          >
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary)' }}>
              {loadingText}
            </span>
            <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
              <span className="loader-dot-pulse" style={{ animationDelay: '0s' }} />
              <span className="loader-dot-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="loader-dot-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact inline loader for card / section level loading states.
 */
export function InlineLoader({ size = 28, message }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2.5px solid var(--border)',
            borderTopColor: 'var(--primary)',
            animation: 'spin-ring 0.8s linear infinite',
          }}
        />
        <AppLogo height={size * 0.6} showText={false} />
      </div>
      {message && <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{message}</span>}
    </div>
  );
}
