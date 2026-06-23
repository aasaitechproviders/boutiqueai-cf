import { useApp } from '../context/AppContext';
import Stepper from '../components/Stepper';

const CIRC = 314; // 2 * PI * 50 (r=50)

export default function GeneratingScreen({ progress, onClose }) {
  const { baseImageUrl } = useApp();
  const pct = Math.round(progress);
  const dashOffset = CIRC - (CIRC * pct / 100);

  const steps = [
    { label: 'Your Photo',     state: 'done' },
    { label: 'Product Photos', state: 'done' },
    { label: 'Generate',       state: 'active' },
  ];

  return (
    <section className="screen active" id="screen-generating">
      <header className="app-header">
        <button className="hdr-btn" onClick={onClose} aria-label="Go back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="hdr-title">New Try-On</div>
        <div className="hdr-btn" style={{ visibility: 'hidden' }} />
      </header>

      <Stepper steps={steps} />

      <div className="gen-wrap">

        {/* ── Photo with scan line ── */}
        <div className="gen-photo-wrap">
          {baseImageUrl
            ? <img src={baseImageUrl} alt="" className="gen-photo-img" />
            : <div className="gen-photo-placeholder">🤳</div>
          }
          {/* scan sweep */}
          <div className="gen-scan-beam" />
          <div className="gen-scan-line" />

          {/* Gold donut overlay — bottom-center of photo */}
          <div className="gen-donut-wrap">
            <svg className="gen-donut" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="donut-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
              </defs>
              {/* track */}
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="9"
              />
              {/* progress arc */}
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke="url(#donut-grad)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 0.4s ease', filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.7))' }}
              />
              {/* sparkle icon center */}
              <g transform="translate(60,60)">
                <path
                  d="M0 -10 L2.4 -2.4 L10 0 L2.4 2.4 L0 10 L-2.4 2.4 L-10 0 L-2.4 -2.4 Z"
                  fill="#FFD700"
                  opacity="0.95"
                />
                <path
                  d="M7 -13 L8 -9.6 L11.4 -8.6 L8 -7.4 L7 -4 L5.8 -7.4 L2.6 -8.6 L5.8 -9.6 Z"
                  fill="#FFD700"
                  opacity="0.6"
                />
              </g>
            </svg>
            <div className="gen-donut-pct">{pct}%</div>
          </div>
        </div>

        <div className="gen-title">Generating your look…</div>
        <div className="gen-sub">Please wait a moment while we prepare the perfect fit for you.</div>

        {/* Progress bar */}
        <div className="gen-bar-row">
          <div className="gen-bar">
            <div className="gen-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="gen-pct">{pct}%</div>
        </div>

        {/* Background process notice */}
        <div className="gen-bg-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
          <div className="gen-bg-notice-text">
            <strong>You can go back safely.</strong>
            {' '}Your look is being generated in the background — it will appear in your
            {' '}<strong>notifications</strong> and <strong>My Looks</strong> when ready.
          </div>
        </div>

        {/* Feature cards */}
        <div className="gen-feats">
          {[
            {
              label: 'AI Processing',
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="5" width="14" height="14" rx="2"/>
                <text x="12" y="15" fontSize="6" fontWeight="800" fill="currentColor" textAnchor="middle" stroke="none">AI</text>
                <line x1="9" y1="2" x2="9" y2="5"/><line x1="15" y1="2" x2="15" y2="5"/>
                <line x1="9" y1="19" x2="9" y2="22"/><line x1="15" y1="19" x2="15" y2="22"/>
                <line x1="2" y1="9" x2="5" y2="9"/><line x1="2" y1="15" x2="5" y2="15"/>
                <line x1="19" y1="9" x2="22" y2="9"/><line x1="19" y1="15" x2="22" y2="15"/>
              </svg>
            },
            {
              label: 'Smart Fit',
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3l1.6 5L19 9.5 14.5 13l1 5.5L12 16l-3.5 2.5 1-5.5L5 9.5 10.4 8z"/>
                <circle cx="18" cy="5" r="1.4" fill="currentColor"/>
                <circle cx="6" cy="18" r="1.2" fill="currentColor"/>
              </svg>
            },
            {
              label: 'High Quality',
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2l2.2 2.4 3.2-.5.7 3.2 2.9 1.5-1.6 2.8 1.6 2.8-2.9 1.5-.7 3.2-3.2-.5L12 22l-2.2-2.4-3.2.5-.7-3.2L3 14.9l1.6-2.8L3 9.3l2.9-1.5.7-3.2 3.2.5z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            },
          ].map(f => (
            <div className="gen-feat-card" key={f.label}>
              {f.icon}
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Safe note */}
        <div className="gen-safe">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
          Your data is safe with us
        </div>
      </div>
    </section>
  );
}
