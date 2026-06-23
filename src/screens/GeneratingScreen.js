import { useApp } from '../context/AppContext';

const CIRC = 603;

export default function GeneratingScreen({ progress, onClose }) {
  const { baseImageUrl } = useApp();
  const pct = Math.round(progress);
  const dashOffset = CIRC - (CIRC * pct / 100);

  return (
    <section className="screen active gen-full-screen" id="screen-generating">

      {/* ── Background photo ── */}
      {baseImageUrl && (
        <div className="gen-bg-photo">
          <img src={baseImageUrl} alt="" />
          {/* scanning overlay — glow line sweeps up and down */}
          <div className="gen-scan-beam" />
          <div className="gen-scan-line" />
        </div>
      )}

      {/* ── Dark overlay so UI reads clearly ── */}
      <div className="gen-dim" />

      {/* ── Back button ── */}
      <button className="gen-back-btn" onClick={onClose} aria-label="Go back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      {/* ── Title ── */}
      <div className="gen-title-top">Generating your look…</div>

      {/* ── Progress ring ── */}
      <div className="gen-ring-wrap gen-ring-center">
        <div className="gen-ring-bg" />
        <svg className="gen-ring" viewBox="0 0 212 212">
          <defs>
            <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--brand)" />
              <stop offset="1" stopColor="var(--brand-2)" />
            </linearGradient>
          </defs>
          <circle className="track" cx="106" cy="106" r="96" />
          <circle
            className="bar" cx="106" cy="106" r="96"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 106 106)"
          />
        </svg>
        <div className="gen-core">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z" opacity=".9"/>
            <path d="M19 3l.6 2.4L22 6l-2.4.6L19 9l-.6-2.6L16 6l2.4-.6z" opacity=".6"/>
            <path d="M6 15l.5 2L8.5 18l-2 .5L6 21l-.5-2.5L3 18l2-.8z" opacity=".5"/>
          </svg>
        </div>
      </div>

      {/* ── Percentage + bar ── */}
      <div className="gen-progress-area">
        <div className="gen-pct-big">{pct}%</div>
        <div className="gen-bar gen-bar-full">
          <div className="gen-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* ── Feature cards ── */}
      <div className="gen-feats gen-feats-bottom">
        {[
          {
            label: 'AI Processing',
            done: true,
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M9 9h1.5M13.5 9H15M9 15h6M9 12h6"/>
                <line x1="7" y1="1" x2="7" y2="3"/><line x1="17" y1="1" x2="17" y2="3"/>
                <line x1="7" y1="21" x2="7" y2="23"/><line x1="17" y1="21" x2="17" y2="23"/>
                <line x1="1" y1="7" x2="3" y2="7"/><line x1="21" y1="7" x2="23" y2="7"/>
                <line x1="1" y1="17" x2="3" y2="17"/><line x1="21" y1="17" x2="23" y2="17"/>
              </svg>
            ),
          },
          {
            label: 'Smart Fit',
            done: false,
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
              </svg>
            ),
          },
          {
            label: 'High Quality',
            done: true,
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2l2.2 2.4 3.2-.5.7 3.2 2.9 1.5-1.6 2.8 1.6 2.8-2.9 1.5-.7 3.2-3.2-.5L12 22l-2.2-2.4-3.2.5-.7-3.2L3 14.9l1.6-2.8L3 9.3l2.9-1.5.7-3.2 3.2.5z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            ),
          },
        ].map(f => (
          <div className="gen-feat-card gen-feat-card--dark" key={f.label}>
            <div className="gen-feat-icon-wrap">
              {f.icon}
              {f.done && (
                <span className="gen-feat-check">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="12" fill="#22c55e"/>
                    <polyline points="7 12 10 15 17 9" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                  </svg>
                </span>
              )}
            </div>
            <span>{f.label}</span>
          </div>
        ))}
      </div>

    </section>
  );
}
