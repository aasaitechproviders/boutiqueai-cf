import { useApp } from '../context/AppContext';

export default function ProfileScreen() {
  const {
    mobile, albumItems, totalTryons,
    hasBaseImage, baseImageUrl,
    setShowBaseModal, setBaseModalContext,
    setCurrentScreen,
    signOut, showToast,
  } = useApp();

  return (
    <section className="screen active" id="screen-profile">
      <header className="app-header">
        <button className="hdr-btn" onClick={() => setCurrentScreen('home')} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="hdr-title">My Profile</div>
        <div className="hdr-btn" />
      </header>

      <div className="screen-scroll">
        <div className="profile-pad">

          {/* Avatar with edit button */}
          <div style={{ position: 'relative', width: 96, height: 96, margin: '12px auto 16px' }}>
            <div className="pf-avatar" style={{ width: 96, height: 96, margin: 0 }}>
              {hasBaseImage && baseImageUrl
                ? <img src={baseImageUrl} alt="Your photo" />
                : <span style={{ fontSize: 36 }}>👤</span>
              }
            </div>
            <button
              onClick={() => { setBaseModalContext('change'); setShowBaseModal(true); }}
              style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--brand)', color: '#fff',
                border: '2px solid var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Change photo"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ width: 12, height: 12 }}>
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>
              </svg>
            </button>
          </div>

          {/* Show only mobile number */}
          <div className="pf-name" style={{ fontSize: 18 }}>+91 {mobile}</div>

          <div className="pf-list">

            {/* My Photo */}
            <button className="pf-item"
              onClick={() => { setBaseModalContext('change'); setShowBaseModal(true); }}>
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="txt">My Photo</div>
              {hasBaseImage
                ? <span style={{ fontSize: 12.5, color: 'var(--green)', fontWeight: 700, marginRight: 8 }}>✓ Set</span>
                : <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600, marginRight: 8 }}>Not set</span>
              }
              <div className="chev">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </button>

            {/* My Looks */}
            <button className="pf-item" onClick={() => setCurrentScreen('looks')}>
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <div className="txt">My Looks</div>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand)', marginRight: 8 }}>
                {totalTryons}
              </span>
              <div className="chev">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </button>

            {/* Help */}
            <button className="pf-item" onClick={() => setCurrentScreen('help')}>
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12" y2="17"/>
                </svg>
              </div>
              <div className="txt">Help & Support</div>
              <div className="chev">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </button>

            {/* Terms of Service */}
            <button className="pf-item" onClick={() => setCurrentScreen('terms')}>
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div className="txt">Terms of Service</div>
              <div className="chev">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </button>

            {/* Privacy Policy */}
            <button className="pf-item" onClick={() => setCurrentScreen('privacy')}>
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <div className="txt">Privacy Policy</div>
              <div className="chev">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </button>

            {/* Sign out */}
            <button className="pf-item" onClick={signOut}>
              <div className="ic red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <div className="txt" style={{ color: 'var(--red)' }}>Sign Out</div>
              <div className="chev">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 28, fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 500, paddingBottom: 8 }}>
            Powered by <b style={{ color: 'var(--brand)' }}>BoutiqueAI</b>
          </div>
        </div>
      </div>
    </section>
  );
}
