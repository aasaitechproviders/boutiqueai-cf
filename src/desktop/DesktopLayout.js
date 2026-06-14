import { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  identifyCustomer, presignUpload, uploadToS3,
  saveBaseImage, downloadTryonApi, deleteTryonApi, CLIENT_MAX_PX
} from '../api';
import { dayLabel, timeOf, filterItems, resizeImageFile, genId } from '../utils';
import ViewerOverlay from '../overlays/ViewerOverlay';
import Toast from '../components/Toast';
import NotificationBell from '../components/NotificationBell';
import { fetchNotifications, markNotificationsRead } from '../api';
import TermsScreen   from '../screens/TermsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import HelpScreen    from '../screens/HelpScreen';

const FILTERS = [
  { key: 'all',       label: 'All Looks'  },
  { key: 'today',     label: 'Today'      },
  { key: 'yesterday', label: 'Yesterday'  },
  { key: 'week',      label: 'This Week'  },
];

export default function DesktopLayout({ onLogin, loading, startGenerate, genProgress, isGenerating, justGenerated }) {
  const {
    agentConfig, mobile, setMobile, sessionId, setSessionId,
    hasBaseImage, setHasBaseImage, baseImageUrl, setBaseImageUrl, setStyleProfile,
    albumItems, setAlbumItems, totalTryons,
    currentScreen, setCurrentScreen,
    currentFilter, setCurrentFilter,
    currentResult, setCurrentResult,
    favSet, toggleFav,
    showToast, setViewerUrl,
  } = useApp();

  // Tab navigation — only 'home' and 'looks' are real tabs now
  const [activeTab,       setActiveTab]       = useState('home');
  // Modal states — Try-On and Profile open as overlays
  const [showTryOnModal,  setShowTryOnModal]  = useState(false);
  const [showProfileModal,setShowProfileModal] = useState(false);
  // Notifications panel
  const [showNotifPanel,  setShowNotifPanel]  = useState(false);
  // Legal / Help page overlay (terms | privacy | help | null)
  const [desktopPage,     setDesktopPage]     = useState(null);

  const [phone,         setPhone]         = useState('');
  const [phoneLoading,  setPhoneLoading]  = useState(false);
  const [showResult,    setShowResult]    = useState(false);
  const [genOverlayDismissed, setGenOverlayDismissed] = useState(false);

  // Desktop-local file state (separate from mobile context)
  const [baseFile,      setBaseFile]      = useState(null);   // { file, base64 }
  const [prodFiles,     setProdFiles]     = useState([]);     // [{ file, base64 }]
  const [uploadingBase, setUploadingBase] = useState(false);

  const baseInputRef    = useRef(null);
  const productInputRef = useRef(null);
  const profileInputRef = useRef(null);

  const biz  = agentConfig?.business_name || agentConfig?.agent_name || 'Boutique';
  const name = agentConfig?.agent_name || biz;
  const logo = agentConfig?.logo_url || null;
  const hero = agentConfig?.hero_image_url || agentConfig?.welcome_image_url || null;

  // Computed active tab for nav highlight — modal tabs light up too
  const navActiveTab = showTryOnModal ? 'tryon' : showProfileModal ? 'profile' : activeTab;

  // ── Open a legal/help page as a desktop overlay ───────────
  function openPage(page) {
    setShowProfileModal(false);
    setShowTryOnModal(false);
    setCurrentScreen(page); // so the screen's back-button fires setCurrentScreen('home')
    setDesktopPage(page);
  }

  // Close the page overlay when the screen's back button calls setCurrentScreen('home')
  useEffect(() => {
    if (desktopPage && currentScreen === 'home') setDesktopPage(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen]);

  // ── Nav handler ───────────────────────────────────────────
  function handleNavClick(key) {
    if (key === 'tryon') {
      setShowTryOnModal(true);
      setShowProfileModal(false);
      return;
    }
    if (key === 'profile') {
      setShowProfileModal(true);
      setShowTryOnModal(false);
      return;
    }
    setActiveTab(key);
    setShowTryOnModal(false);
    setShowProfileModal(false);
  }

  // ── Phone login ──────────────────────────────────────────
  async function continuePhone() {
    if (phone.length < 10 || phoneLoading) return;
    setPhoneLoading(true);
    try {
      const d = await identifyCustomer(agentConfig._id, phone);
      setHasBaseImage(d.has_base_image || false);
      setBaseImageUrl(d.base_image_url || null);
      setStyleProfile(d.style_profile || null);
    } catch (e) {}
    localStorage.setItem('ba_mobile', phone);
    localStorage.setItem('ba_agent_id', agentConfig._id);
    setMobile(phone);
    setSessionId(genId());
    setPhoneLoading(false);
    onLogin(phone);
  }

  // ── File pickers ─────────────────────────────────────────
  function pickBase(e) {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setBaseFile({ file, base64: ev.target.result });
    reader.readAsDataURL(file);
  }

  function pickProduct(e) {
    const file = e.target.files[0]; e.target.value = '';
    if (!file || prodFiles.length >= 3) return;
    const reader = new FileReader();
    reader.onload = ev => setProdFiles(prev => [...prev, { file, base64: ev.target.result }]);
    reader.readAsDataURL(file);
  }

  function removeProduct(i) {
    setProdFiles(prev => prev.filter((_, idx) => idx !== i));
  }

  // Profile photo upload
  async function pickProfilePhoto(e) {
    const file = e.target.files[0]; e.target.value = '';
    if (!file || !mobile) return;
    setUploadingBase(true);
    try {
      const ctype = file.type || 'image/jpeg';
      const { upload_url, public_url } = await presignUpload(sessionId, ctype);
      const buf = await resizeImageFile(file, CLIENT_MAX_PX);
      await uploadToS3(upload_url, buf, ctype);
      await saveBaseImage(agentConfig._id, mobile, public_url);
      setHasBaseImage(true);
      setBaseImageUrl(public_url);
      showToast('Profile photo updated! ✓');
    } catch (err) {
      showToast('Upload failed: ' + err.message);
    } finally {
      setUploadingBase(false);
    }
  }

  // ── Generate ─────────────────────────────────────────────
  async function handleGenerate() {
    if (!hasBaseImage && !baseFile) { showToast('Please add your photo first'); return; }
    if (prodFiles.length === 0)     { showToast('Please add at least one product photo'); return; }

    // Close the try-on modal immediately — generating overlay will appear
    setShowTryOnModal(false);

    // Upload base photo if newly selected
    if (baseFile) {
      setUploadingBase(true);
      try {
        const ctype = baseFile.file.type || 'image/jpeg';
        const { upload_url, public_url } = await presignUpload(sessionId, ctype);
        const buf = await resizeImageFile(baseFile.file, CLIENT_MAX_PX);
        await uploadToS3(upload_url, buf, ctype);
        await saveBaseImage(agentConfig._id, mobile, public_url);
        setHasBaseImage(true);
        setBaseImageUrl(public_url);
        setBaseFile(null);
      } catch (err) {
        showToast('Photo upload failed: ' + err.message);
        setUploadingBase(false);
        return;
      }
      setUploadingBase(false);
    }

    startGenerate(prodFiles, (newItem) => {
      setProdFiles([]);
      if (newItem) setCurrentResult(newItem);
      setShowResult(true);
    });
  }

  // ── Result actions ────────────────────────────────────────
  function openResult(item) {
    setCurrentResult(item);
    setShowResult(true);
  }

  async function handleDownload(item) {
    showToast('Preparing download…');
    try {
      const data = await downloadTryonApi(item.id, mobile);
      if (data) {
        const bytes = Uint8Array.from(atob(data.image_b64), c => c.charCodeAt(0));
        const blob  = new Blob([bytes], { type: data.content_type || 'image/jpeg' });
        const href  = URL.createObjectURL(blob);
        const a     = document.createElement('a');
        a.href = href; a.download = data.filename || `tryon_${item.id}.jpg`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(href), 8000);
        showToast('Downloaded! ✓'); return;
      }
    } catch (e) {}
    window.open(item.result_url, '_blank');
  }

  async function handleDelete(item) {
    if (!window.confirm('Remove this look from your album?')) return;
    try { await deleteTryonApi(item.id, mobile); } catch (e) {}
    setAlbumItems(prev => prev.filter(i => i.id !== item.id));
    setShowResult(false);
    showToast('Removed from album');
  }

  async function handleShare(item) {
    const url = item.result_url;
    if (navigator.share) {
      try { await navigator.share({ title: 'My Virtual Try-On Look', url }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(url); showToast('Link copied! ✓'); return; }
      catch (e) {}
    }
    showToast('Copy this link: ' + url);
  }

  function handleSignOut() {
    localStorage.removeItem('ba_mobile');
    localStorage.removeItem('ba_agent_id');
    window.location.reload();
  }

  // ── Computed ─────────────────────────────────────────────
  const filtered = filterItems(albumItems, currentFilter);
  const order = [], groups = {};
  filtered.forEach(it => {
    const l = dayLabel(it.created_at);
    if (!groups[l]) { groups[l] = []; order.push(l); }
    groups[l].push(it);
  });
  const recentItems = albumItems.slice(0, 7);
  const photoReady  = hasBaseImage || !!baseFile;
  const canGenerate = photoReady && prodFiles.length > 0 && !isGenerating && !uploadingBase;
  const pct         = Math.round(genProgress);

  const tryonSteps = [
    { label: 'Your Photo', state: photoReady ? 'done' : 'active' },
    { label: 'Products',   state: prodFiles.length > 0 ? 'done' : (photoReady ? 'active' : '') },
    { label: 'Generate',   state: prodFiles.length > 0 ? 'active' : '' },
  ];

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <div className="dt">
      <div className="dt-loading">
        <div className="load-ring" />
        <div className="load-text">Loading your boutique…</div>
      </div>
    </div>
  );

  // ── Login page ─────────────────────────────────────────────
  if (!mobile) return (
    <div className="dt-login-page">
      <img className="dt-login-bg" src="/hero-web.png" alt="" draggable={false} onContextMenu={e => e.preventDefault()} />

      <div className="dt-login-logo-overlay">
        <div className="dt-login-logo-box">
          {logo ? <img src={logo} alt="" className="dt-login-logo-img" /> : <span className="dt-login-logo-fallback">💎</span>}
        </div>
      </div>

      <div className="dt-login-name-overlay">
        <div className="dt-login-welcome-eyebrow">Welcome To</div>
        <span className="dt-login-biz-name">{biz}</span>
        <div className="dt-login-tagline">Step In · Try On · Fall In Love</div>
      </div>

      <div className="dt-login-card-new">
        <div className="dt-login-card-hdr">
          <svg viewBox="0 0 24 24" fill="currentColor" className="dt-login-hdr-ic">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
          Enter your mobile number
        </div>
        <div className="dt-login-input-row">
          <div className="dt-login-cc-new">
            <span className="dt-login-flag">🇮🇳</span>
            <span>+91</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div className="dt-login-inp-wrap">
            <input className="dt-login-inp-new" type="tel" inputMode="numeric" placeholder="98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onKeyDown={e => e.key === 'Enter' && continuePhone()}
            />
            <div className="dt-login-person-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          </div>
          <button className="dt-login-continue-btn" disabled={phone.length < 10 || phoneLoading} onClick={continuePhone}>
            <span>{phoneLoading ? 'Checking…' : 'Continue'}</span>
            {!phoneLoading && (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>)}
          </button>
        </div>
        <div className="dt-login-card-footer">
          <div className="dt-login-safe-new">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            Your data is safe with us
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginTop:6 }}>
            <button onClick={() => openPage('terms')} style={{ fontSize:11, color:'var(--brand)', fontWeight:700, textDecoration:'underline', textUnderlineOffset:2, background:'none', border:'none', cursor:'pointer', padding:0 }}>Terms</button>
            <span style={{ fontSize:11, color:'var(--ink-3)' }}>·</span>
            <button onClick={() => openPage('privacy')} style={{ fontSize:11, color:'var(--brand)', fontWeight:700, textDecoration:'underline', textUnderlineOffset:2, background:'none', border:'none', cursor:'pointer', padding:0 }}>Privacy Policy</button>
          </div>
          <div className="dt-login-powered-new">Powered by <strong>BoutiqueAI</strong></div>
        </div>
      </div>

      <Toast />
    </div>
  );

  // ── Dashboard ─────────────────────────────────────────────
  return (
    <div className="dt">
      <NavBar
        logo={logo} name={name} mobile={mobile} biz={biz}
        baseImageUrl={baseImageUrl} activeTab={navActiveTab}
        onTabClick={handleNavClick} showToast={showToast}
        onNotifClick={() => setShowNotifPanel(true)}
      />

      <div className="dt-body">
        <div className="dt-page">

          {/* ── HOME TAB ── */}
          {activeTab === 'home' && (
            <>
              {/* Sticky bar — filters right-aligned + New Try-On */}
              <div className="dt-looks-sticky-bar">
                <div className="dt-chips" style={{ marginBottom: 0 }}>
                  {FILTERS.map(f => (
                    <button key={f.key}
                      className={`dt-chip${currentFilter === f.key ? ' active' : ''}`}
                      onClick={() => setCurrentFilter(f.key)}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <button className="dt-gen-btn" style={{ width: 'auto', padding: '0 20px', height: 40, borderRadius: 11, fontSize: 13.5, flexShrink: 0 }}
                  onClick={() => setShowTryOnModal(true)}>
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}>
                    <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/>
                  </svg>
                  New Try-On
                </button>
              </div>

              {/* 2-col layout */}
              <div className="dt-dash-grid">
                {/* Left: album (no chips — moved to sticky bar) */}
                <div>
                  {filtered.length === 0 ? (
                    <div className="dt-empty">
                      <div className="dt-empty-emoji">👗</div>
                      <div className="dt-empty-t">No looks yet</div>
                      <div className="dt-empty-s">Upload a product photo to generate your first AI try-on look.</div>
                      <button className="dt-empty-btn" onClick={() => setShowTryOnModal(true)}>
                        + Create your first look
                      </button>
                    </div>
                  ) : (
                    order.map(label => (
                      <div key={label} style={{ marginBottom: 24 }}>
                        <div className="dt-sec-head">
                          <div className="dt-sec-title">{label}</div>
                          <button className="dt-sec-link" onClick={() => setActiveTab('looks')}>
                            See all
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          </button>
                        </div>
                        <div className="dt-look-grid">
                          {groups[label].map((item, i) => (
                            <AlbumCard key={item.id} item={item} index={i} onClick={() => openResult(item)} />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Right: quick try-on panel + recent */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <QuickTryOnPanel
                    hasPhoto={photoReady} baseFile={baseFile} baseImageUrl={baseImageUrl}
                    prodFiles={prodFiles} canGenerate={canGenerate}
                    steps={tryonSteps} isGenerating={isGenerating}
                    onPickBase={() => baseInputRef.current?.click()}
                    onClearBase={() => setBaseFile(null)}
                    onPickProduct={() => prodFiles.length < 3 && productInputRef.current?.click()}
                    onRemoveProduct={removeProduct}
                    onGenerate={handleGenerate}
                    onOpenFull={() => setShowTryOnModal(true)}
                  />

                  {recentItems.length > 0 && (
                    <div className="dt-panel">
                      <div className="dt-panel-head">Recent Try-Ons</div>
                      <div className="dt-panel-body" style={{ paddingTop: 12 }}>
                        {recentItems.map(item => (
                          <div className="dt-recent-item" key={item.id} onClick={() => openResult(item)}>
                            <div className="dt-recent-thumb">
                              <img src={item.result_url} alt=""
                                onError={e => { e.target.style.opacity = '.3'; }} />
                            </div>
                            <div className="dt-recent-info">
                              <div className="dt-recent-name">AI Try-On Look</div>
                              <div className="dt-recent-time">{timeOf(item.created_at)} · {dayLabel(item.created_at)}</div>
                            </div>

                          </div>
                        ))}
                        <button className="dt-view-all" onClick={() => setActiveTab('looks')}>
                          View All Looks
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── LOOKS TAB ── */}
          {activeTab === 'looks' && (
            <>
              {/* Sticky bar — filters right-aligned + New Try-On */}
              <div className="dt-looks-sticky-bar">
                <div className="dt-chips" style={{ marginBottom: 0 }}>
                  {FILTERS.map(f => (
                    <button key={f.key}
                      className={`dt-chip${currentFilter === f.key ? ' active' : ''}`}
                      onClick={() => setCurrentFilter(f.key)}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <button className="dt-gen-btn" style={{ width: 'auto', padding: '0 20px', height: 40, borderRadius: 11, fontSize: 13.5, flexShrink: 0 }}
                  onClick={() => setShowTryOnModal(true)}>
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}>
                    <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/>
                  </svg>
                  New Try-On
                </button>
              </div>

              {/* Scrollable grid */}
              {filtered.length === 0 ? (
                <div className="dt-empty">
                  <div className="dt-empty-emoji">👗</div>
                  <div className="dt-empty-t">No looks yet</div>
                  <div className="dt-empty-s">Your generated looks will appear here.</div>
                  <button className="dt-empty-btn" onClick={() => setShowTryOnModal(true)}>
                    + Create your first look
                  </button>
                </div>
              ) : (
                <div className="dt-looks-grid">
                  {filtered.map((item, i) => (
                    <AlbumCard key={item.id} item={item} index={i} onClick={() => openResult(item)} />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={baseInputRef}    type="file" accept="image/*" style={{ display: 'none' }} onChange={pickBase} />
      <input ref={productInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickProduct} />
      <input ref={profileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickProfilePhoto} />

      {/* Generating overlay — z-index 90, above everything */}
      {isGenerating && !genOverlayDismissed && (
        <div className="dt-gen-overlay">
          <div className="dt-gen-card">
            {/* Close button — job keeps running in background */}
            <button
              className="dt-gen-close"
              onClick={() => setGenOverlayDismissed(true)}
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className="dt-gen-ring-wrap">
              <div className="dt-gen-ring-bg" />
              <svg className="dt-gen-ring" viewBox="0 0 130 130">
                <defs>
                  <linearGradient id="dgg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="var(--brand)" />
                    <stop offset="1" stopColor="var(--brand-2)" />
                  </linearGradient>
                </defs>
                <circle className="track" cx="65" cy="65" r="56" />
                <circle className="bar" cx="65" cy="65" r="56"
                  strokeDasharray="352"
                  strokeDashoffset={352 - (352 * pct / 100)}
                  transform="rotate(-90 65 65)"
                />
              </svg>
              <div className="dt-gen-core">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z" opacity=".9"/>
                  <path d="M19 3l.6 2.4L22 6l-2.4.6L19 9l-.6-2.6L16 6l2.4-.6z" opacity=".5"/>
                </svg>
              </div>
            </div>
            <div className="dt-gen-title">Generating your look…</div>
            <div className="dt-gen-sub">AI is fitting the outfit perfectly. This takes about 30–60 seconds.</div>
            <div className="dt-gen-bar-row">
              <div className="dt-gen-bar">
                <div className="dt-gen-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="dt-gen-pct">{pct}%</div>
            </div>
            {/* Background process notice */}
            <div className="dt-gen-bg-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                <line x1="6" y1="1" x2="6" y2="4"/>
                <line x1="10" y1="1" x2="10" y2="4"/>
                <line x1="14" y1="1" x2="14" y2="4"/>
              </svg>
              <span>You can close this — your result will appear automatically when ready.</span>
            </div>
            <div className="dt-gen-feats">
              {[
                ['AI Processing', <AIIcon />],
                ['Smart Fit',     <FitIcon />],
                ['High Quality',  <QualIcon />],
              ].map(([label, icon]) => (
                <div className="dt-gen-feat" key={label}>
                  {icon}
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result modal */}
      {showResult && currentResult && (
        <ResultModal
          item={currentResult}
          justGenerated={justGenerated}
          isFav={favSet.has(currentResult.id)}
          onClose={() => setShowResult(false)}
          onFav={() => toggleFav(currentResult.id)}
          onDelete={() => handleDelete(currentResult)}
          onGenerateAgain={() => { setShowResult(false); setShowTryOnModal(true); }}
          onViewImage={setViewerUrl}
        />
      )}

      {/* ── Try-On Modal ── */}
      {showTryOnModal && (
        <TryOnModal
          onClose={() => setShowTryOnModal(false)}
          hasPhoto={photoReady}
          baseFile={baseFile}
          baseImageUrl={baseImageUrl}
          prodFiles={prodFiles}
          steps={tryonSteps}
          canGenerate={canGenerate}
          isGenerating={isGenerating}
          onPickBase={() => baseInputRef.current?.click()}
          onClearBase={() => setBaseFile(null)}
          onPickProduct={() => prodFiles.length < 3 && productInputRef.current?.click()}
          onRemoveProduct={removeProduct}
          onGenerate={handleGenerate}
        />
      )}

      {/* ── Profile Modal ── */}
      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          mobile={mobile}
          biz={biz}
          baseImageUrl={baseImageUrl}
          hasBaseImage={hasBaseImage}
          albumItems={albumItems}
          totalTryons={totalTryons}
          uploadingBase={uploadingBase}
          onPickProfilePhoto={() => profileInputRef.current?.click()}
          showToast={showToast}
          onSignOut={handleSignOut}
          onOpenPage={openPage}
        />
      )}

      {/* ── Notifications Panel ── */}
      {showNotifPanel && (
        <NotifPanel onClose={() => setShowNotifPanel(false)} />
      )}

      {/* ── Legal / Help Page Overlay ── */}
      {desktopPage && (
        <div
          className="dt-overlay-backdrop"
          onClick={e => e.target === e.currentTarget && setDesktopPage(null)}
          style={{ zIndex: 200 }}
        >
          <div style={{
            background: 'var(--surface)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 680,
            maxHeight: '88vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          }}>
            {/* Standalone close button at top-right for desktop UX */}
            <button
              onClick={() => setDesktopPage(null)}
              aria-label="Close"
              style={{
                position: 'absolute', top: 12, right: 14, zIndex: 10,
                background: 'var(--surface-2)', border: 'none', cursor: 'pointer',
                width: 32, height: 32, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink-2)',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={16} height={16}>
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {desktopPage === 'terms'   && <TermsScreen />}
              {desktopPage === 'privacy' && <PrivacyScreen />}
              {desktopPage === 'help'    && <HelpScreen />}
            </div>
          </div>
        </div>
      )}

      <ViewerOverlay />
      <Toast />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NAV BAR
═══════════════════════════════════════════════════════ */
function NavBar({ logo, name, mobile, biz, baseImageUrl, activeTab, onTabClick, showToast, onNotifClick }) {
  const tabs = [
    { key: 'home',    label: 'Home',    Icon: HomeIcon    },
    { key: 'tryon',   label: 'Try-On',  Icon: TryOnIcon   },
    { key: 'looks',   label: 'Looks',   Icon: LooksIcon   },
    { key: 'profile', label: 'Profile', Icon: ProfileIcon },
  ];
  return (
    <nav className="dt-nav">
      <div className="dt-nav-brand">
        <div className="dt-nav-logo">
          {logo ? <img src={logo} alt="" /> : (name[0] || 'B').toUpperCase()}
        </div>
        <div className="dt-nav-title">{name}</div>
      </div>
      {/* Spacer pushes everything after it to the right */}
      <div style={{ flex: 1 }} />

      <div className="dt-nav-right">
        {/* Tabs — now on the right side */}
        {mobile && (
          <div className="dt-nav-tabs" style={{ marginRight: 8 }}>
            {tabs.map(({ key, label, Icon }) => (
              <button key={key}
                className={`dt-nav-tab${activeTab === key ? ' active' : ''}`}
                onClick={() => onTabClick(key)}>
                <Icon /> {label}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        {mobile && <div style={{ width: 1, height: 22, background: '#E8E7F0', marginRight: 8 }} />}

        {/* Real notification bell — only when logged in */}
        {mobile
          ? <NotificationBell onPress={onNotifClick} />
          : (
            <button className="dt-nav-icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
              </svg>
            </button>
          )
        }
        {mobile && (
          <button className="dt-nav-profile" onClick={() => onTabClick('profile')}>
            <div className="dt-nav-avatar">
              {baseImageUrl
                ? <img src={baseImageUrl} alt="" onError={e => { e.target.style.display = 'none'; }} />
                : (mobile || '').slice(-2)
              }
            </div>
            <span className="dt-nav-uname">{biz}</span>
            <svg className="dt-nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        )}
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════
   QUICK TRY-ON PANEL  (home right column — inline)
═══════════════════════════════════════════════════════ */
function QuickTryOnPanel({ hasPhoto, baseFile, baseImageUrl, prodFiles, canGenerate, steps, isGenerating,
  onPickBase, onClearBase, onPickProduct, onRemoveProduct, onGenerate, onOpenFull }) {
  return (
    <div className="dt-panel">
      <div className="dt-panel-head" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        Quick Try-On
        <button className="dt-sec-link" style={{ fontSize:12 }} onClick={onOpenFull}>
          Full screen
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
        </button>
      </div>
      <div className="dt-panel-body">
        {/* Mini stepper */}
        <div className="dt-mini-stepper">
          {steps.map((step, i) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
              <div className="dt-mini-step">
                <div className={`dt-mini-dot${step.state ? ' ' + step.state : ''}`}>
                  {step.state === 'done'
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12"/></svg>
                    : i + 1}
                </div>
                <div className={`dt-mini-lbl${step.state ? ' on' : ''}`}>{step.label}</div>
              </div>
              {i < steps.length - 1 && <div className={`dt-mini-line${step.state === 'done' ? ' done' : ''}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Your photo */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 7 }}>
            Step 1 — Your Photo
          </div>
          {hasPhoto ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9F8FC', borderRadius: 12, padding: '10px 12px', border: '1px solid #EEEDF8' }}>
              <div style={{ width: 44, height: 44, borderRadius: 9, overflow: 'hidden', background: '#EEEDF5', flexShrink: 0, border: '1px solid #E8E7F0' }}>
                {(baseFile?.base64 || baseImageUrl) && (
                  <img src={baseFile?.base64 || baseImageUrl} alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>✓ Photo ready</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Your base photo is set</div>
              </div>
              <button className="dt-change-link" onClick={onPickBase} style={{ margin: 0 }}>Change</button>
            </div>
          ) : (
            <div className="dt-upload-zone" onClick={onPickBase}>
              <div className="dt-upload-zone-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="dt-upload-zone-label">Upload Your Photo</div>
              <div className="dt-upload-zone-hint">Full body or half body</div>
            </div>
          )}
        </div>

        {/* Step 2: Product photos */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 7 }}>
            Step 2 — Product Photos ({prodFiles.length}/3)
          </div>
          <div className="dt-prod-thumbs">
            {prodFiles.map((p, i) => (
              <div className="dt-prod-thumb" key={i}>
                <img src={p.base64} alt="" />
                <button className="dt-prod-thumb-rm" onClick={() => onRemoveProduct(i)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
            {prodFiles.length < 3 && (
              <div className="dt-prod-add" onClick={onPickProduct}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Generate */}
        <button className="dt-gen-btn" disabled={!canGenerate} onClick={onGenerate}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/>
          </svg>
          {isGenerating ? 'Generating…' : 'Generate Look'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TRY-ON MODAL  (opened by nav "Try-On" tab)
═══════════════════════════════════════════════════════ */
function TryOnModal({ onClose, hasPhoto, baseFile, baseImageUrl, prodFiles, steps,
  canGenerate, isGenerating, onPickBase, onClearBase, onPickProduct, onRemoveProduct, onGenerate }) {

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="dt-overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dt-tryon-modal-box">

        {/* Header */}
        <div className="dt-modal-hdr">
          <div>
            <div className="dt-modal-title">New Try-On</div>
            <div className="dt-modal-title-sub">Upload your photo and product images to generate your AI look</div>
          </div>
          <button className="dt-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body — flex column, no scroll; everything sizes to fit */}
        <div className="dt-modal-body" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0, padding: '16px 24px 20px' }}>

          {/* Stepper — fixed height, doesn't grow */}
          <div className="dt-modal-stepper" style={{ flexShrink: 0, marginBottom: 14 }}>
            {steps.map((step, i) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800,
                    background: step.state ? 'linear-gradient(135deg,var(--brand),var(--brand-2))' : '#F4F3F8',
                    color: step.state ? '#fff' : '#B0AFC0',
                    border: step.state ? 'none' : '1.5px solid #E8E7F0',
                    boxShadow: step.state ? '0 4px 12px var(--brand-ring)' : 'none',
                    transition: '.25s',
                  }}>
                    {step.state === 'done'
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 14, height: 14 }}><polyline points="20 6 9 17 4 12"/></svg>
                      : i + 1}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: step.state ? 'var(--ink)' : '#B0AFC0', whiteSpace: 'nowrap' }}>
                    {step.label}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, borderRadius: 2, margin: '0 10px 18px',
                    background: step.state === 'done' ? 'var(--brand)' : '#E8E7F0',
                    transition: '.25s',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Two-column — takes all remaining space, never overflows */}
          <div className="dt-modal-2col" style={{ flex: 1, minHeight: 0 }}>

            {/* Left — Your Photo */}
            <div className="dt-modal-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="dt-modal-panel-title" style={{ flexShrink: 0 }}>Your Photo</div>

              {hasPhoto ? (
                <>
                  {/* Photo — object-fit: contain so the full image is always visible */}
                  <div style={{ flex: 1, minHeight: 0, borderRadius: 12, overflow: 'hidden',
                    background: '#F0EFF8', border: '1px solid #EEEDF8', marginBottom: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={baseFile?.base64 || baseImageUrl} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Photo uploaded
                    </span>
                    <button className="dt-change-link" onClick={onPickBase} style={{ margin: 0 }}>Change photo</button>
                  </div>
                </>
              ) : (
                <div className="dt-upload-zone" style={{ flex: 1, minHeight: 0, padding: 24 }} onClick={onPickBase}>
                  <div className="dt-upload-zone-ic" style={{ width: 52, height: 52, borderRadius: 14 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="dt-upload-zone-label" style={{ fontSize: 13.5 }}>Upload Your Photo</div>
                  <div className="dt-upload-zone-hint">Full body or half body for best results</div>
                </div>
              )}
            </div>

            {/* Right — Product Photos */}
            <div className="dt-modal-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Header row — title left, hint right */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexShrink: 0, marginBottom: 14 }}>
                <div className="dt-modal-panel-title" style={{ marginBottom: 0 }}>Product Photos</div>
                <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>Add up to 3</span>
              </div>

              {/* Product slots — fixed aspect ratio, icon always centered */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, flexShrink: 0 }}>

                {/* Filled slots */}
                {prodFiles.map((p, i) => (
                  <div key={i} style={{ aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden',
                    position: 'relative', background: '#F4F3F8',
                    border: '2px solid var(--brand-soft)' }}>
                    <img src={p.base64} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'var(--surface-2)', display: 'block' }} />
                    <button className="dt-prod-thumb-rm" style={{ width: 24, height: 24, top: 7, right: 7 }}
                      onClick={() => onRemoveProduct(i)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 10, height: 10 }}>
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Empty slots — icon naturally centered within aspect-ratio height */}
                {Array.from({ length: 3 - prodFiles.length }).map((_, i) => (
                  <div key={`e${i}`} onClick={onPickProduct}
                    style={{ aspectRatio: '3/4', borderRadius: 16,
                      border: '2px dashed var(--brand-ring)',
                      background: 'var(--brand-softer)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 12, cursor: 'pointer',
                      transition: 'all .18s' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--brand)';
                      e.currentTarget.style.background = 'var(--brand-softer)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--brand-ring)';
                      e.currentTarget.style.background = 'var(--brand-softer)';
                    }}>
                    {/* Camera icon — gradient rounded square (iOS app-icon style) */}
                    <div style={{
                      width: 56, height: 56, borderRadius: 16,
                      background: 'linear-gradient(145deg, var(--brand), var(--brand-2))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 6px 16px rgba(14,36,32,.32)',
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"
                        style={{ width: 26, height: 26 }}>
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>Add photo</span>
                  </div>
                ))}
              </div>

              {/* Push generate button to bottom */}
              <div style={{ flex: 1 }} />

              {/* Generate button — anchored at bottom */}
              <button className="dt-gen-btn" style={{ flexShrink: 0, height: 50, fontSize: 15, borderRadius: 14, marginTop: 14 }}
                disabled={!canGenerate} onClick={onGenerate}>
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 17, height: 17 }}>
                  <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/>
                </svg>
                {isGenerating ? 'Generating…' : 'Generate Look'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROFILE MODAL  (opened by nav "Profile" tab)
═══════════════════════════════════════════════════════ */
function ProfileModal({ onClose, mobile, biz, baseImageUrl, hasBaseImage, albumItems, totalTryons,
  uploadingBase, onPickProfilePhoto, showToast, onSignOut, onOpenPage }) {

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="dt-overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dt-profile-modal-box">

        {/* Header */}
        <div className="dt-modal-hdr">
          <div className="dt-modal-title">My Profile</div>
          <button className="dt-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="dt-modal-body">

          {/* Avatar hero */}
          <div className="dt-pm-hero">
            <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
              <div className="dt-pm-avatar">
                {baseImageUrl
                  ? <img src={baseImageUrl} alt="" onError={e => { e.target.style.display = 'none'; }} />
                  : <span>{(mobile || '').slice(-2)}</span>
                }
              </div>
              <button className="dt-pm-avatar-edit" onClick={onPickProfilePhoto}
                title={uploadingBase ? 'Uploading…' : 'Change photo'}>
                {uploadingBase
                  ? <div className="load-ring" style={{ width: 11, height: 11, borderWidth: 2 }} />
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}>
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>
                    </svg>
                }
              </button>
            </div>
            <div>
              <div className="dt-pm-phone">+91 {mobile}</div>
              <div className="dt-pm-sub">{biz}</div>
            </div>
          </div>

          {/* My Photo section */}
          <div className="dt-pm-section-head">My Try-On Photo</div>
          <button className="dt-profile-row" onClick={onPickProfilePhoto}>
            <div className="dt-profile-row-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="dt-profile-row-txt">My Photo</div>
            {hasBaseImage
              ? <span style={{ fontSize: 12.5, color: 'var(--green)', fontWeight: 700, marginRight: 6 }}>✓ Set</span>
              : <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600, marginRight: 6 }}>Not set</span>
            }
            {baseImageUrl && (
              <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', flexShrink: 0, marginRight: 6, border: '1px solid #EEEDF8' }}>
                <img src={baseImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <svg className="dt-profile-row-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Account section */}
          <div className="dt-pm-section-head" style={{ marginTop: 18 }}>Account</div>
          <button className="dt-profile-row">
            <div className="dt-profile-row-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="dt-profile-row-txt">Mobile Number</div>
            <div className="dt-profile-row-val">+91 {mobile}</div>
          </button>
          <button className="dt-profile-row" onClick={() => showToast(`${totalTryons} looks generated`)}>
            <div className="dt-profile-row-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6 6.9 18.2l1.9-5.8L4 8.8h6.1z"/>
              </svg>
            </div>
            <div className="dt-profile-row-txt">Looks Generated</div>
            <div className="dt-profile-row-val" style={{ color: 'var(--brand)', fontWeight: 800 }}>{totalTryons}</div>
          </button>
          <button className="dt-profile-row" onClick={() => onOpenPage('privacy')}>
            <div className="dt-profile-row-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="dt-profile-row-txt">Privacy & Data</div>
            <svg className="dt-profile-row-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <button className="dt-profile-row" onClick={() => onOpenPage('help')}>
            <div className="dt-profile-row-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12" y2="17"/>
              </svg>
            </div>
            <div className="dt-profile-row-txt">Help & Support</div>
            <svg className="dt-profile-row-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <div style={{ height: 1, background: '#F0EFF8', margin: '10px 0 6px' }} />

          <button className="dt-profile-row" onClick={onSignOut}>
            <div className="dt-profile-row-ic red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <div className="dt-profile-row-txt" style={{ color: 'var(--red)' }}>Sign Out</div>
          </button>

          <div style={{ textAlign: 'center', marginTop: 22, fontSize: 12, color: 'var(--ink-3)', paddingBottom: 4 }}>
            Powered by <b style={{ color: 'var(--brand)' }}>BoutiqueAI</b>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginTop:8, paddingBottom:4 }}>
            <button onClick={() => onOpenPage('terms')} style={{ fontSize:11.5, color:'var(--brand)', fontWeight:700, textDecoration:'underline', textUnderlineOffset:2, background:'none', border:'none', cursor:'pointer', padding:0 }}>Terms of Service</button>
            <span style={{ fontSize:11, color:'var(--ink-3)' }}>·</span>
            <button onClick={() => onOpenPage('privacy')} style={{ fontSize:11.5, color:'var(--brand)', fontWeight:700, textDecoration:'underline', textUnderlineOffset:2, background:'none', border:'none', cursor:'pointer', padding:0 }}>Privacy Policy</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RESULT MODAL
═══════════════════════════════════════════════════════ */
function ResultModal({ item, justGenerated, isFav, onClose, onFav, onDelete, onGenerateAgain, onViewImage }) {
  const prods = item.product_image_urls || (item.product_image_url ? [item.product_image_url] : []);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="dt-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dt-result-modal">
        {/* Left: images */}
        <div className="dt-result-left">
          <div className="dt-result-main-img" style={{ flex: '1 0 0' }}>
            <img src={item.result_url} alt="" className="ss-protected"
              draggable={false}
              onContextMenu={e => e.preventDefault()}
              onClick={() => onViewImage(item.result_url)} />
            <div className="dt-result-main-badge">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>
              LOOK
            </div>
          </div>
          {prods.length > 0 && (
            <div className="dt-result-thumbs">
              {prods.slice(0, 3).map((u, i) => (
                <div className="dt-result-thumb" key={i}>
                  <img src={u} alt="" className="ss-protected"
                    draggable={false}
                    onContextMenu={e => e.preventDefault()}
                    onClick={() => onViewImage(u)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: info + actions */}
        <div className="dt-result-right">
          <div className="dt-result-header">
            <div className="dt-result-title">
              {justGenerated ? <>Look <em>Ready</em> ✨</> : 'Your Look'}
            </div>
            <button className="dt-result-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {justGenerated && (
            <div className="dt-result-success">
              <div className="dt-result-success-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <div className="dt-result-success-t">Your look is ready!</div>
                <div className="dt-result-success-s">Automatically saved to your album.</div>
              </div>
            </div>
          )}

          <div className="dt-result-outfit">
            <div className="dt-result-outfit-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
              </svg>
            </div>
            <div>
              <div className="dt-result-outfit-t">Outfit Details</div>
              <div className="dt-result-outfit-s">
                {prods.length > 1 ? `${prods.length} items combined` : 'AI Virtual Try-On Look'}
              </div>
            </div>
          </div>

          <div className="dt-result-acts">
            <button className="dt-result-act" onClick={onGenerateAgain}>
              <div className="dt-result-act-ic" style={{ background: 'var(--brand-soft)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--brand)' }}>
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                </svg>
              </div>
              <div><div className="dt-result-act-label">Generate Again</div><div className="dt-result-act-sub">New try-on</div></div>
            </button>
            <button className="dt-result-act" onClick={onFav}>
              <div className="dt-result-act-ic" style={{ background: 'rgba(244,63,94,.08)' }}>
                <svg viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" style={{ color: '#f43f5e' }}>
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
                </svg>
              </div>
              <div><div className="dt-result-act-label">{isFav ? 'Favorited' : 'Favorite'}</div><div className="dt-result-act-sub">Save to faves</div></div>
            </button>
          </div>

          <button onClick={onDelete} style={{
            width: '100%', padding: '11px', borderRadius: 12,
            background: 'rgba(224,53,75,.06)', border: '1px solid rgba(224,53,75,.15)',
            color: 'var(--red)', fontSize: 13.5, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', transition: '.15s',
          }}>
            Remove from Album
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ALBUM CARD
═══════════════════════════════════════════════════════ */
function AlbumCard({ item, index, onClick }) {
  return (
    <div style={{
      position: 'relative', borderRadius: 16, overflow: 'hidden',
      background: '#F4F3F8', aspectRatio: '3/4', cursor: 'pointer',
      boxShadow: '0 1px 3px rgba(20,20,43,.06), 0 4px 12px rgba(20,20,43,.06)',
      transition: '.2s', animation: `fadeUp .3s ${index * 40}ms both`,
    }} onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <img src={item.result_url} alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'var(--surface-2)' }}
        onError={e => { e.target.style.opacity = '.3'; }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(15,12,35,.6) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 10, left: 10,
        background: 'linear-gradient(135deg,var(--brand),var(--brand-2))',
        color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '.06em',
        padding: '3px 9px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 10, height: 10 }}>
          <path d="M13 2L3 14h7l-1 8 10-12h-7z"/>
        </svg>
        LOOK
      </div>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '8px 10px',
      }}>
        <span style={{ color: '#fff', fontSize: 11.5, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,.4)' }}>
          {timeOf(item.created_at)}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NOTIFICATIONS PANEL  (desktop slide-in from right)
═══════════════════════════════════════════════════════ */
function NotifPanel({ onClose }) {
  const { agentConfig, mobile, setCurrentScreen } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  const agentId = agentConfig?._id || null;

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (!agentId || !mobile) { setLoading(false); return; }
    fetchNotifications(agentId, mobile)
      .then(data => {
        setNotifications(data.notifications || []);
        // Mark all read silently
        markNotificationsRead(agentId, mobile).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [agentId, mobile]);

  return (
    <div className="dt-overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dt-notif-panel">
        {/* Header */}
        <div className="dt-notif-panel-hdr">
          <span className="dt-notif-panel-title">Notifications</span>
          <button className="dt-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="dt-notif-panel-body">
          {loading ? (
            <div className="dt-notif-empty">
              <div className="notif-loading-ring" />
              <p>Loading…</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="dt-notif-empty">
              <div style={{ fontSize: 44 }}>🔔</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>No notifications yet</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center' }}>
                We'll notify you when your try-on is ready
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifications.map(n => (
                <DesktopNotifCard key={n._id} notif={n} onView={() => { onClose(); }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DesktopNotifCard({ notif, onView }) {
  const isCompleted = notif.type === 'completed';
  const diff = Date.now() - new Date(notif.created_at).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const timeAgo = mins < 1 ? 'Just now' : mins < 60 ? `${mins}m ago` : hours < 24 ? `${hours}h ago` : `${days}d ago`;

  return (
    <div className={`notif-card${notif.read ? '' : ' notif-card--unread'}`} style={{ borderRadius: 14 }}>
      {!notif.read && <div className="notif-unread-dot" />}
      <div className="notif-card-left">
        {isCompleted && notif.thumbnail_url ? (
          <img className="notif-thumb" src={notif.thumbnail_url} alt="" />
        ) : (
          <div className={`notif-icon-circle notif-icon-circle--${notif.type}`}>
            {isCompleted
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
          </div>
        )}
      </div>
      <div className="notif-card-content">
        <div className="notif-card-title">{notif.title}</div>
        <div className="notif-card-body">{notif.body}</div>
        <div className="notif-card-time">{timeAgo}</div>
      </div>
      {isCompleted && (
        <button className="notif-view-btn" onClick={onView}>View</button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════ */
function HomeIcon()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function TryOnIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/></svg>; }
function LooksIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function ProfileIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function AIIcon()      { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="5" width="14" height="14" rx="2"/><line x1="9" y1="2" x2="9" y2="5"/><line x1="15" y1="2" x2="15" y2="5"/><line x1="9" y1="19" x2="9" y2="22"/><line x1="15" y1="19" x2="15" y2="22"/><line x1="2" y1="9" x2="5" y2="9"/><line x1="2" y1="15" x2="5" y2="15"/><line x1="19" y1="9" x2="22" y2="9"/><line x1="19" y1="15" x2="22" y2="15"/></svg>; }
function FitIcon()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.6 5L19 9.5 14.5 13l1 5.5L12 16l-3.5 2.5 1-5.5L5 9.5 10.4 8z"/><circle cx="18" cy="5" r="1.4" fill="currentColor"/><circle cx="6" cy="18" r="1.2" fill="currentColor"/></svg>; }
function QualIcon()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l2.2 2.4 3.2-.5.7 3.2 2.9 1.5-1.6 2.8 1.6 2.8-2.9 1.5-.7 3.2-3.2-.5L12 22l-2.2-2.4-3.2.5-.7-3.2L3 14.9l1.6-2.8L3 9.3l2.9-1.5.7-3.2 3.2.5z"/><polyline points="9 12 11 14 15 10"/></svg>; }
