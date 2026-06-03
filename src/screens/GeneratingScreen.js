import { useState } from 'react';
import Stepper from '../components/Stepper';

const CIRC = 603;

export default function GeneratingScreen({ progress }) {
  const pct = Math.round(progress);
  const dashOffset = CIRC - (CIRC * pct / 100);

  const steps = [
    { label: 'Your Photo', state: 'done' },
    { label: 'Product Photos', state: 'done' },
    { label: 'Generate',   state: 'active' },
  ];

  return (
    <section className="screen active" id="screen-generating">
      <header className="app-header">
        <button className="hdr-btn" style={{ visibility: 'hidden' }} />
        <div className="hdr-title">New Try-On</div>
        <div className="hdr-btn" style={{ visibility: 'hidden' }} />
      </header>

      <Stepper steps={steps} />

      <div className="gen-wrap">
        {/* Animated ring */}
        <div className="gen-ring-wrap">
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

        <div className="gen-title">Generating your look…</div>
        <div className="gen-sub">Please wait a moment while we prepare the perfect fit for you.</div>

        {/* Progress bar */}
        <div className="gen-bar-row">
          <div className="gen-bar">
            <div className="gen-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="gen-pct">{pct}%</div>
        </div>

        {/* Feature cards — white cards like screenshot */}
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
