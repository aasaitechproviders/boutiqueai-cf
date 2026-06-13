import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { identifyCustomer } from '../api';
import { genId } from '../utils';

export default function WelcomeScreen({ onLogin }) {
  const { agentConfig, setMobile, setHasBaseImage, setBaseImageUrl, setStyleProfile, setSessionId } = useApp();
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed,  setAgreed]  = useState(false);
  const [shake,   setShake]   = useState(false);

  const biz  = agentConfig?.business_name || agentConfig?.agent_name || 'Boutique';
  const logo = agentConfig?.logo_url || null;

  const isReturning = !!localStorage.getItem('ba_terms_accepted');

  function onPhoneChange(e) {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
  }

  async function continuePhone() {
    if (phone.length < 10 || loading) return;

    if (!isReturning && !agreed) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    const raw = phone.slice(-10);
    setLoading(true);
    try {
      const data = await identifyCustomer(agentConfig._id, raw);
      setHasBaseImage(data.has_base_image || false);
      setBaseImageUrl(data.base_image_url || null);
      setStyleProfile(data.style_profile || null);
    } catch (e) { console.warn('[identify]', e.message); }

    if (!isReturning) localStorage.setItem('ba_terms_accepted', '1');

    localStorage.setItem('ba_mobile', raw);
    localStorage.setItem('ba_agent_id', agentConfig._id);
    setMobile(raw);
    setSessionId(genId());
    setLoading(false);
    onLogin(raw);
  }

  return (
    <section className="screen screen-welcome active" style={{ backgroundImage: "url('/hero-mobile.png')", backgroundSize: '100% 100%', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat' }}>

      <img className="w-bg" src="/hero-mobile.png" alt="" draggable={false} onContextMenu={e => e.preventDefault()} />

      <div className="w-top-cluster">
        <div className="w-logo-overlay">
          <div className="w-logo-box">
            {logo ? <img src={logo} alt="" className="w-logo-img" /> : <span className="w-logo-fallback">💎</span>}
          </div>
        </div>
        <div className="w-name-overlay">
          <div className="w-welcome-eyebrow">Welcome To</div>
          <span className="w-biz-name">{biz}</span>
          <div className="w-tagline">Step In · Try On · Fall In Love</div>
        </div>
      </div>

      <div className="w-login-card">

        <div className="w-card-hdr">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-card-hdr-ic">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
          Enter your mobile number
        </div>

        <div className="w-phone-row">
          <div className="w-phone-cc">
            <span className="w-flag">🇮🇳</span>
            <span>+91</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <input
            className="w-phone-input"
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            value={phone}
            onChange={onPhoneChange}
            onKeyDown={e => e.key === 'Enter' && continuePhone()}
          />
        </div>

        {!isReturning && (
          <div className={`w-terms-row${shake ? ' w-terms-shake' : ''}`}
            onClick={() => setAgreed(v => !v)}>
            <div className={`w-terms-box${agreed ? ' checked' : ''}`}>
              {agreed && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <p className="w-terms-text">
              I agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="w-terms-link">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="w-terms-link">Privacy Policy</a>
              {' '}— including AI processing of my photo for virtual try-on.
            </p>
          </div>
        )}

        <button
          className={`w-continue-btn${loading ? ' w-continue-btn--loading' : ''}`}
          disabled={phone.length < 10 || loading || (!isReturning && !agreed)}
          onClick={continuePhone}
        >
          {loading ? (
            <>
              <div className="btn-spinner" />
              <span>Checking…</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </>
          )}
        </button>

        <div className="w-card-safe">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
          Your data is safe · Photos processed by AI only
        </div>
      </div>

    </section>
  );
}
