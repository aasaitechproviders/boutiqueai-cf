import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { setPin } from '../api';

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What is the name of the city you were born in?",
  "What was the name of your first school?",
  "What is your favourite childhood food?",
  "What is your elder sibling's first name?",
  "What was the name of the street you grew up on?",
];

// ── Reusable 4-dot PIN input ───────────────────────────────────────────────
function PinDots({ value, onChange, onComplete, label, error }) {
  const inputs = [useRef(), useRef(), useRef(), useRef()];

  function handleKey(i, e) {
    const d = e.key;
    if (d === 'Backspace') {
      if (value[i]) {
        onChange(value.slice(0, i) + '' + value.slice(i + 1));
      } else if (i > 0) {
        inputs[i - 1].current?.focus();
        onChange(value.slice(0, i - 1) + '' + value.slice(i));
      }
      return;
    }
    if (!/^\d$/.test(d)) return;
    const next = value.slice(0, i) + d + value.slice(i + 1);
    onChange(next);
    if (i < 3) inputs[i + 1].current?.focus();
    else if (next.length === 4) onComplete?.(next);
  }

  return (
    <div className="pin-field">
      {label && <div className="pin-field-label">{label}</div>}
      <div className="pin-dots-row">
        {[0, 1, 2, 3].map(i => (
          <input
            key={i}
            ref={inputs[i]}
            className={`pin-dot-input${error ? ' error' : ''}${value[i] ? ' filled' : ''}`}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ''}
            onChange={() => {}}
            onKeyDown={e => handleKey(i, e)}
            onFocus={e => e.target.select()}
          />
        ))}
      </div>
      {error && <div className="pin-error">{error}</div>}
    </div>
  );
}

// ── Main PinSetupScreen ────────────────────────────────────────────────────
export default function PinSetupScreen({ onDone }) {
  const { agentConfig, mobile } = useApp();

  const [step,     setStep]     = useState(1);   // 1=enter, 2=confirm, 3=security
  const [pin,      setPin_]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [question, setQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [answer,   setAnswer]   = useState('');
  const [error,    setError]    = useState('');
  const [saving,   setSaving]   = useState(false);

  // Auto-advance step 1 → 2 when 4 digits entered
  useEffect(() => { if (pin.length === 4 && step === 1) setStep(2); }, [pin, step]);

  // Auto-check confirm when 4 digits entered
  useEffect(() => {
    if (confirm.length === 4 && step === 2) {
      if (confirm !== pin) {
        setError("PINs don't match. Try again.");
        setConfirm('');
      } else {
        setError('');
        setStep(3);
      }
    }
  }, [confirm, pin, step]);

  async function handleSave() {
    if (!answer.trim()) { setError('Please type your answer'); return; }
    if (!agentConfig?._id || !mobile) return;
    setSaving(true);
    setError('');
    try {
      await setPin(agentConfig._id, mobile, pin, question, answer.trim());
      // Mark session as PIN-verified
      sessionStorage.setItem('ba_pin_ok', '1');
      onDone();
    } catch (e) {
      setError(e.message || 'Could not save PIN. Try again.');
    } finally {
      setSaving(false);
    }
  }

  const stepLabels = ['Create PIN', 'Confirm PIN', 'Recovery'];

  return (
    <section className="screen pin-screen active">

      {/* Header */}
      <div className="pin-header">
        <div className="pin-logo">
          {agentConfig?.logo_url
            ? <img src={agentConfig.logo_url} alt="" />
            : <span>💎</span>
          }
        </div>
        <div className="pin-header-title">Secure Your Account</div>
        <div className="pin-header-sub">Create a 4-digit PIN to protect your try-on photos</div>
      </div>

      {/* Step indicator */}
      <div className="pin-steps">
        {stepLabels.map((label, i) => (
          <div key={i} className={`pin-step${step > i + 1 ? ' done' : step === i + 1 ? ' active' : ''}`}>
            <div className="pin-step-dot">
              {step > i + 1
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                : i + 1
              }
            </div>
            <div className="pin-step-label">{label}</div>
          </div>
        ))}
        <div className="pin-step-track">
          <div className="pin-step-fill" style={{ width: `${((step - 1) / 2) * 100}%` }} />
        </div>
      </div>

      <div className="pin-body">

        {/* Step 1 — Enter PIN */}
        {step === 1 && (
          <div className="pin-card">
            <div className="pin-card-icon">🔐</div>
            <div className="pin-card-title">Create your PIN</div>
            <div className="pin-card-sub">Enter any 4 digits you'll remember</div>
            <PinDots value={pin} onChange={v => { setPin_(v); setError(''); }} label="" error={error} />
          </div>
        )}

        {/* Step 2 — Confirm PIN */}
        {step === 2 && (
          <div className="pin-card">
            <div className="pin-card-icon">✅</div>
            <div className="pin-card-title">Confirm your PIN</div>
            <div className="pin-card-sub">Enter the same 4 digits again</div>
            <PinDots value={confirm} onChange={v => { setConfirm(v); setError(''); }} label="" error={error} />
            <button className="pin-back-link" onClick={() => { setStep(1); setConfirm(''); setPin_(''); setError(''); }}>
              ← Change PIN
            </button>
          </div>
        )}

        {/* Step 3 — Security question */}
        {step === 3 && (
          <div className="pin-card">
            <div className="pin-card-icon">🛡️</div>
            <div className="pin-card-title">Recovery Question</div>
            <div className="pin-card-sub">Used to reset your PIN if you forget it</div>

            <div className="pin-form-field">
              <label className="pin-form-label">Choose a question</label>
              <div className="pin-select-wrap">
                <select
                  className="pin-select"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                >
                  {SECURITY_QUESTIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
                <svg className="pin-select-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            <div className="pin-form-field">
              <label className="pin-form-label">Your answer</label>
              <input
                className="pin-form-input"
                type="text"
                placeholder="Type your answer…"
                value={answer}
                onChange={e => { setAnswer(e.target.value); setError(''); }}
              />
              <div className="pin-form-hint">Answer is not case-sensitive</div>
            </div>

            {error && <div className="pin-error" style={{ textAlign: 'center' }}>{error}</div>}

            <button
              className="pin-save-btn"
              disabled={!answer.trim() || saving}
              onClick={handleSave}
            >
              {saving ? 'Saving…' : 'Save & Continue →'}
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
