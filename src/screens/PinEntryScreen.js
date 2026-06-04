import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { verifyPin, getSecurityQuestion, verifySecurityAnswer } from '../api';

// ── Shared PinDots ─────────────────────────────────────────────────────────
function PinDots({ value, onChange, onComplete, error, disabled }) {
  const inputs = [useRef(), useRef(), useRef(), useRef()];

  // Auto-focus first dot on mount
  useEffect(() => { inputs[0].current?.focus(); }, []); // eslint-disable-line

  // Handle digit input via onChange — works on both physical & mobile soft keyboards
  function handleChange(i, e) {
    if (disabled) return;
    const raw = e.target.value;
    // Extract only the last digit typed (input has maxLength=1 but we guard anyway)
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    const next = value.slice(0, i) + digit + value.slice(i + 1);
    onChange(next);
    if (i < 3) inputs[i + 1].current?.focus();
    else if (next.length === 4) onComplete?.(next);
  }

  // Keep onKeyDown only for Backspace — reliable on all platforms
  function handleKeyDown(i, e) {
    if (disabled) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[i]) {
        onChange(value.slice(0, i) + '' + value.slice(i + 1));
      } else if (i > 0) {
        inputs[i - 1].current?.focus();
        onChange(value.slice(0, i - 1) + '' + value.slice(i));
      }
    }
  }

  return (
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
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onFocus={e => e.target.select()}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

// ── Lockout countdown ──────────────────────────────────────────────────────
function Countdown({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) { onExpire(); return; }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onExpire]);
  const m = Math.floor(left / 60);
  const s = left % 60;
  return <span>{m}:{String(s).padStart(2, '0')}</span>;
}

// ── Main PinEntryScreen ────────────────────────────────────────────────────
export default function PinEntryScreen({ onVerified }) {
  const { agentConfig, mobile } = useApp();

  const [view,         setView]         = useState('entry');   // 'entry' | 'forgot_answer' | 'forgot_locked'
  const [pin,          setPin]          = useState('');
  const [error,        setError]        = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [locked,       setLocked]       = useState(false);
  const [lockSeconds,  setLockSeconds]  = useState(0);
  const [checking,     setChecking]     = useState(false);

  // Forgot PIN state
  const [secQuestion,  setSecQuestion]  = useState('');
  const [secAnswer,    setSecAnswer]    = useState('');
  const [secError,     setSecError]     = useState('');
  const [secLoading,   setSecLoading]   = useState(false);
  const [loadingQ,     setLoadingQ]     = useState(false);

  const maskedMobile = mobile ? `+91 XXXXX ${mobile.slice(-5)}` : '';

  // Auto-submit when 4 digits entered
  async function handlePinComplete(fullPin) {
    if (checking || locked) return;
    setChecking(true);
    setError('');
    try {
      const result = await verifyPin(agentConfig._id, mobile, fullPin);
      if (result.verified) {
        sessionStorage.setItem('ba_pin_ok', '1');
        onVerified();
        return;
      }
      if (result.locked) {
        setLocked(true);
        setLockSeconds(result.seconds_left || 300);
        setPin('');
        return;
      }
      setAttemptsLeft(result.attempts_left);
      setError(result.attempts_left === 1
        ? '⚠️ Wrong PIN. 1 attempt left before 5-minute lock.'
        : `Wrong PIN. ${result.attempts_left} attempts left.`
      );
      setPin('');
    } catch (e) {
      setError('Connection error. Please try again.');
      setPin('');
    } finally {
      setChecking(false);
    }
  }

  const handleUnlock = useCallback(() => {
    setLocked(false);
    setLockSeconds(0);
    setError('');
    setAttemptsLeft(null);
  }, []);

  // Load security question for forgot flow
  async function openForgot() {
    setLoadingQ(true);
    setSecError('');
    try {
      const data = await getSecurityQuestion(agentConfig._id, mobile);
      if (data.locked) {
        setLocked(true);
        setLockSeconds(data.seconds_left || 300);
        setView('entry');
        return;
      }
      setSecQuestion(data.security_question);
      setView('forgot_answer');
    } catch (e) {
      setError('Could not load recovery question. Try again.');
    } finally {
      setLoadingQ(false);
    }
  }

  async function submitSecurityAnswer() {
    if (!secAnswer.trim() || secLoading) return;
    setSecLoading(true);
    setSecError('');
    try {
      const result = await verifySecurityAnswer(agentConfig._id, mobile, secAnswer.trim());
      if (result.verified) {
        // PIN cleared on backend — app will detect no PIN and show PinSetup
        sessionStorage.removeItem('ba_pin_ok');
        window.location.reload();  // simplest way to re-trigger boot check
        return;
      }
      if (result.locked) {
        setLocked(true);
        setLockSeconds(result.seconds_left || 300);
        setView('entry');
        return;
      }
      setSecError(result.attempts_left === 1
        ? '⚠️ Wrong answer. 1 attempt left before lockout.'
        : `Wrong answer. ${result.attempts_left} attempts left.`
      );
      setSecAnswer('');
    } catch (e) {
      setSecError('Connection error. Try again.');
    } finally {
      setSecLoading(false);
    }
  }

  const logo = agentConfig?.logo_url || null;
  const name = agentConfig?.agent_name || agentConfig?.business_name || 'Boutique';

  return (
    <section className="screen pin-screen active">

      {/* Header */}
      <div className="pin-header">
        <div className="pin-logo">
          {logo ? <img src={logo} alt="" /> : <span>💎</span>}
        </div>
        <div className="pin-header-title">{name}</div>
        <div className="pin-header-sub">{maskedMobile}</div>
      </div>

      <div className="pin-body">

        {/* ── PIN Entry view ── */}
        {view === 'entry' && (
          <div className="pin-card">
            <div className="pin-card-icon">🔒</div>
            <div className="pin-card-title">Enter your PIN</div>
            <div className="pin-card-sub">Enter your 4-digit PIN to continue</div>

            {locked ? (
              <div className="pin-locked-box">
                <div className="pin-locked-icon">⏳</div>
                <div className="pin-locked-title">Account locked</div>
                <div className="pin-locked-sub">
                  Too many wrong attempts. Try again in{' '}
                  <strong><Countdown seconds={lockSeconds} onExpire={handleUnlock} /></strong>
                </div>
              </div>
            ) : (
              <>
                <PinDots
                  value={pin}
                  onChange={v => { setPin(v); setError(''); }}
                  onComplete={handlePinComplete}
                  error={error}
                  disabled={checking}
                />
                {error && <div className="pin-error">{error}</div>}
                {checking && <div className="pin-checking">Checking…</div>}
              </>
            )}

            <button
              className="pin-forgot-link"
              onClick={openForgot}
              disabled={loadingQ || locked}
            >
              {loadingQ ? 'Loading…' : 'Forgot PIN?'}
            </button>
          </div>
        )}

        {/* ── Forgot PIN — security answer view ── */}
        {view === 'forgot_answer' && (
          <div className="pin-card">
            <div className="pin-card-icon">🛡️</div>
            <div className="pin-card-title">Recovery Question</div>
            <div className="pin-card-sub">Answer correctly to reset your PIN</div>

            <div className="pin-recovery-question">{secQuestion}</div>

            <div className="pin-form-field">
              <label className="pin-form-label">Your answer</label>
              <input
                className="pin-form-input"
                type="text"
                placeholder="Type your answer…"
                value={secAnswer}
                onChange={e => { setSecAnswer(e.target.value); setSecError(''); }}
                onKeyDown={e => e.key === 'Enter' && submitSecurityAnswer()}
              />
              <div className="pin-form-hint">Answer is not case-sensitive</div>
            </div>

            {secError && <div className="pin-error" style={{ textAlign: 'center' }}>{secError}</div>}

            <button
              className="pin-save-btn"
              disabled={!secAnswer.trim() || secLoading}
              onClick={submitSecurityAnswer}
            >
              {secLoading ? 'Checking…' : 'Verify Answer'}
            </button>

            <button className="pin-back-link" onClick={() => { setView('entry'); setSecAnswer(''); setSecError(''); }}>
              ← Back to PIN
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
