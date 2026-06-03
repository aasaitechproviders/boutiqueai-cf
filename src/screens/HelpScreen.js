import { useState } from 'react';
import { useApp } from '../context/AppContext';

const FAQS = [
  {
    q: 'How does virtual try-on work?',
    a: 'You upload your photo once, then add product photos from the boutique. Our AI generates a realistic image of you wearing that outfit. The whole process takes about 30–60 seconds.',
  },
  {
    q: 'How long are my generated images kept?',
    a: 'AI-generated try-on images are automatically deleted 12 hours after they are created. Make sure to save any looks you want to keep before that window closes. Your profile photo stays until you change or delete it.',
  },
  {
    q: 'Is my photo safe?',
    a: 'Yes. Your photo is stored securely on AWS S3 with private access. It is only shared with our AI providers (Google Gemini and Microsoft Azure) to generate your try-on image. We never sell or share your photo with anyone else.',
  },
  {
    q: 'Can I delete my photo?',
    a: 'Yes. Go to Profile → My Photo and tap Change to replace it, or contact us at support@aasaitech.in to have it deleted completely. Uploading a new photo automatically deletes the previous one.',
  },
  {
    q: 'Why does the try-on look slightly different from the actual product?',
    a: 'Virtual try-on uses AI image generation, which is illustrative. Colours, fit, and fabric texture may vary from the actual product. Always check with the boutique for accurate sizing and colour details.',
  },
  {
    q: 'Can I try on multiple items at once?',
    a: 'Yes! You can add up to 3 product photos for a combo try-on. The AI will dress you in all items together as a complete outfit.',
  },
  {
    q: 'I got an error during generation. What should I do?',
    a: 'Try again — most errors are temporary. Make sure your internet connection is stable. If the problem persists, reach out to us at support@aasaitech.in with a screenshot.',
  },
  {
    q: 'How do I change my profile photo?',
    a: 'Go to Profile → My Photo → tap the edit button or the row. Upload a new full-body or half-body photo in good lighting for best results.',
  },
  {
    q: 'How do I save a generated look?',
    a: 'Open the look from your album and use the Download button. Images are deleted after 12 hours so save the ones you love right away.',
  },
  {
    q: 'Is this service free?',
    a: 'This virtual try-on experience is provided to you free of charge by the boutique. The boutique owner pays for the service on their plan.',
  },
];

export default function HelpScreen() {
  const { setCurrentScreen, agentConfig } = useApp();
  const [openIndex, setOpenIndex] = useState(null);
  const [name,    setName]    = useState('');
  const [message, setMessage] = useState('');
  const [sent,    setSent]    = useState(false);
  const [sending, setSending] = useState(false);

  const biz = agentConfig?.business_name || agentConfig?.agent_name || 'BoutiqueAI';

  function toggle(i) {
    setOpenIndex(prev => prev === i ? null : i);
  }

  async function sendMessage() {
    if (!message.trim() || sending) return;
    setSending(true);
    // Opens the default mail client with pre-filled body — no backend needed for now
    const subject = encodeURIComponent(`BoutiqueAI Help Request — ${biz}`);
    const body    = encodeURIComponent(`Name: ${name || 'Not provided'}\n\nMessage:\n${message}`);
    window.open(`mailto:support@aasaitech.in?subject=${subject}&body=${body}`);
    await new Promise(r => setTimeout(r, 600));
    setSent(true);
    setSending(false);
    setName('');
    setMessage('');
  }

  return (
    <section className="screen screen-legal active">
      <div className="legal-header">
        <button className="legal-back" onClick={() => setCurrentScreen('profile')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="legal-title">Help & Support</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="legal-body">

        {/* Hero */}
        <div className="help-hero">
          <div className="help-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12" y2="17" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="help-hero-title">How can we help?</div>
          <div className="help-hero-sub">
            Browse answers below or send us a message — we reply within 24 hours.
          </div>
        </div>

        {/* Quick contact cards */}
        <a href="mailto:support@aasaitech.in" className="help-contact-card">
          <div className="help-contact-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div>
            <div className="help-contact-label">Email Support</div>
            <div className="help-contact-value">support@aasaitech.in</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ width: 16, height: 16, color: 'var(--brand)', marginLeft: 'auto', flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>

        <a href="tel:+918939134777" className="help-contact-card">
          <div className="help-contact-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <div>
            <div className="help-contact-label">Call Us</div>
            <div className="help-contact-value">+91 89391 34777</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ width: 16, height: 16, color: 'var(--brand)', marginLeft: 'auto', flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>

        {/* Important notice */}
        <div className="help-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ width: 16, height: 16, flexShrink: 0, color: '#C9A84C', marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span>
            <strong>Remember:</strong> Generated try-on images are automatically deleted after{' '}
            <strong>12 hours</strong>. Save the looks you love before they expire.
          </span>
        </div>

        {/* FAQs */}
        <div className="help-section-title">Frequently Asked Questions</div>
        <div className="help-faq-list">
          {FAQS.map((faq, i) => (
            <div key={i} className={`help-faq-item${openIndex === i ? ' open' : ''}`}>
              <button className="help-faq-q" onClick={() => toggle(i)}>
                <span>{faq.q}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="help-faq-chev">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {openIndex === i && (
                <div className="help-faq-a">{faq.a}</div>
              )}
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div className="help-section-title" style={{ marginTop: 28 }}>Send Us a Message</div>

        {sent ? (
          <div className="help-sent-box">
            <div style={{ fontSize: 36 }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Message sent!</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-3)', textAlign: 'center', lineHeight: 1.5 }}>
              Your email app should have opened. We'll reply to you at{' '}
              <strong>support@aasaitech.in</strong> within 24 hours.
            </div>
            <button className="help-sent-again" onClick={() => setSent(false)}>
              Send another message
            </button>
          </div>
        ) : (
          <div className="help-form">
            <div className="help-form-field">
              <label className="help-form-label">Your Name (optional)</label>
              <input
                className="help-form-input"
                type="text"
                placeholder="e.g. Priya"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="help-form-field">
              <label className="help-form-label">How can we help? *</label>
              <textarea
                className="help-form-textarea"
                placeholder="Describe your issue or question…"
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            <button
              className="help-send-btn"
              disabled={!message.trim() || sending}
              onClick={sendMessage}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                style={{ width: 16, height: 16 }}>
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              {sending ? 'Opening email…' : 'Send Message'}
            </button>
            <div className="help-form-note">
              This will open your email app. We reply within 24 hours.
            </div>
          </div>
        )}

        {/* Legal links */}
        <div className="help-legal-row">
          <button className="help-legal-btn" onClick={() => setCurrentScreen('terms')}>Terms of Service</button>
          <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>·</span>
          <button className="help-legal-btn" onClick={() => setCurrentScreen('privacy')}>Privacy Policy</button>
        </div>

        <div className="legal-footer">
          © 2026 Aasai Tech Providers Private Limited, Devapandalam, Kallakurichi, Tamil Nadu, India — 606402.
        </div>

      </div>
    </section>
  );
}
