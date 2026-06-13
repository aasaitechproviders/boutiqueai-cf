import { useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import {
  fetchAgent, fetchAlbum, enqueueTryon, pollForResult,
  proxyUploadImage, identifyCustomer, CLIENT_MAX_PX, getSlug,
  checkPinStatus,
} from './api';
import { genId, resizeImageFile } from './utils';

import WelcomeScreen    from './screens/WelcomeScreen';
import HomeScreen       from './screens/HomeScreen';
import LooksScreen      from './screens/LooksScreen';
import TryOnScreen      from './screens/TryOnScreen';
import GeneratingScreen from './screens/GeneratingScreen';
import ResultScreen     from './screens/ResultScreen';
import ProfileScreen       from './screens/ProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import TermsScreen         from './screens/TermsScreen';
import PrivacyScreen       from './screens/PrivacyScreen';
import HelpScreen          from './screens/HelpScreen';
import PinSetupScreen      from './screens/PinSetupScreen';
import PinEntryScreen      from './screens/PinEntryScreen';

import BottomNav         from './components/BottomNav';
import NotificationBell  from './components/NotificationBell';
import Toast     from './components/Toast';

import BasePhotoOverlay   from './overlays/BasePhotoOverlay';
import ActionSheetOverlay from './overlays/ActionSheetOverlay';
import DrawerOverlay      from './overlays/DrawerOverlay';
import ViewerOverlay      from './overlays/ViewerOverlay';

import DesktopLayout from './desktop/DesktopLayout';
import './desktop/desktop.css';

function AppInner() {
  const {
    agentConfig, setAgentConfig,
    mobile, setMobile,
    hasBaseImage, setHasBaseImage,
    setBaseImageUrl, setStyleProfile,
    setAlbumItems, setTotalTryons, setAlbumHasMore,
    currentScreen, setCurrentScreen,
    loadFavs, showToast,
    setIsGenerating,
    setCurrentResult, setShowBaseModal,
    setSessionId,
  } = useApp();

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 960);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 960px)');
    const handler = e => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [loading,           setLoading]           = useState(true);
  const [genProgress,       setGenProgress]        = useState(0);
  const [justGenerated,     setJustGenerated]      = useState(false);
  const [isGeneratingLocal, setIsGeneratingLocal]  = useState(false);
  // 'idle' | 'need_setup' | 'need_entry' | 'verified'
  const [pinState,          setPinState]           = useState('idle');

  const sessionIdRef    = useRef(null);
  const mobileRef       = useRef(null);
  const agentConfigRef  = useRef(null);
  const hasBaseImageRef = useRef(false);
  const genCreeper      = useRef(null);

  useEffect(() => { mobileRef.current = mobile; },       [mobile]);
  useEffect(() => { agentConfigRef.current = agentConfig; }, [agentConfig]);
  useEffect(() => { hasBaseImageRef.current = hasBaseImage; }, [hasBaseImage]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { boot(); }, []);

  async function boot() {
    const ref = getSlug();
    try {
      const data = await fetchAgent(ref);
      const storedId = localStorage.getItem('ba_agent_id');
      if (storedId && storedId !== String(data._id)) {
        localStorage.removeItem('ba_mobile');
        localStorage.removeItem('ba_agent_id');
      }
      agentConfigRef.current = data;
      setAgentConfig(data);
      // Brand colour is fixed — no per-agent override
      document.title = `${data.agent_name || data.business_name || 'Boutique'} — Virtual Try-On`;
      loadFavs(data._id);
      await restoreOrWelcome(data);
    } catch (err) {
      const fb = { _id: 'demo', agent_name: 'BoutiqueAI', business_name: 'My Boutique' };
      agentConfigRef.current = fb;
      setAgentConfig(fb);
      loadFavs('demo');
      showToast('Could not load boutique: ' + (err.name === 'AbortError' ? 'Request timed out' : err.message));
      setCurrentScreen('welcome');
    } finally {
      setLoading(false);
    }
  }

  async function restoreOrWelcome(config) {
    const saved = localStorage.getItem('ba_mobile');
    if (saved) {
      const sid = genId();
      sessionIdRef.current = sid;
      setSessionId(sid);
      mobileRef.current = saved;
      setMobile(saved);
      try {
        const d = await identifyCustomer(config._id, saved);
        hasBaseImageRef.current = d.has_base_image || false;
        setHasBaseImage(d.has_base_image || false);
        setBaseImageUrl(d.base_image_url || null);
        setStyleProfile(d.style_profile || null);
      } catch (e) {}

      // ── PIN gate (mobile only — desktop skips) ────────────────────────
      if (window.innerWidth < 960) {
        const alreadyVerified = sessionStorage.getItem('ba_pin_ok') === '1';
        if (!alreadyVerified) {
          try {
            const { has_pin } = await checkPinStatus(config._id, saved);
            if (has_pin) {
              setPinState('need_entry');
              return; // don't load album or go home yet — PIN gate
            } else {
              setPinState('need_setup');
              return; // new user needs to create a PIN first
            }
          } catch (e) {
            console.warn('[PIN] check failed — skipping gate:', e.message);
          }
        }
      }

      await loadAlbumForUser(config, saved);
      setCurrentScreen('home');
    } else {
      setCurrentScreen('welcome');
    }
  }

  async function loadAlbumForUser(config, mob) {
    try {
      const { tryons, total, has_more } = await fetchAlbum(config._id, mob);
      const items = tryons
        .map(t => ({
          id:                 t.id,
          result_url:         t.result_url,
          image_deleted:      t.image_deleted      || false,
          product_image_url:  t.product_image_url  || null,
          product_image_urls: t.product_image_urls || null,
          is_combo:           t.is_combo           || false,
          created_at:         t.created_at,
        }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAlbumItems(items);
      setTotalTryons(total);
      setAlbumHasMore(has_more);
    } catch (e) { console.warn('[loadAlbum]', e.message); }
  }

  async function onLogin(mob) {
    const sid = genId();
    sessionIdRef.current = sid;
    setSessionId(sid);
    mobileRef.current = mob;

    // ── PIN gate for new logins (mobile only) ─────────────────────────
    if (window.innerWidth < 960) {
      try {
        const { has_pin } = await checkPinStatus(agentConfigRef.current._id, mob);
        if (!has_pin) {
          setPinState('need_setup');
          return; // PIN setup will call onPinVerified when done
        }
        // Existing user logging in on a new session — show entry
        setPinState('need_entry');
        return;
      } catch (e) {
        console.warn('[PIN] onLogin check failed — skipping gate:', e.message);
      }
    }

    await loadAlbumForUser(agentConfigRef.current, mob);
    setCurrentScreen('home');
    if (!hasBaseImageRef.current) setTimeout(() => setShowBaseModal(true), 450);
  }

  // Called by PinSetupScreen and PinEntryScreen when PIN is verified/set
  async function onPinVerified() {
    setPinState('verified');
    sessionStorage.setItem('ba_pin_ok', '1');
    await loadAlbumForUser(agentConfigRef.current, mobileRef.current);
    setCurrentScreen('home');
    if (!hasBaseImageRef.current) setTimeout(() => setShowBaseModal(true), 450);
  }

  async function startGenerate(filesToUse, onDone) {
    const sid    = sessionIdRef.current;
    const mob    = mobileRef.current;
    const config = agentConfigRef.current;

    if (!filesToUse || filesToUse.length === 0) { showToast('Please add product photos first'); return; }
    if (!hasBaseImageRef.current)               { showToast('Please add your photo first');    return; }
    if (!sid)                                   { showToast('Session expired — please refresh'); return; }

    const isDesktopCall = typeof onDone === 'function';

    setIsGeneratingLocal(true);
    setIsGenerating(true);
    setJustGenerated(false);
    if (!isDesktopCall) setCurrentScreen('generating');
    startCreeper();

    try {
      const productUrls = [];
      for (let i = 0; i < filesToUse.length; i++) {
        const pf = filesToUse[i];

        let buf;
        try {
          buf = await resizeImageFile(pf.file, CLIENT_MAX_PX);
        } catch (e) {
          throw new Error('Could not process photo ' + (i + 1) + ' — try a different image');
        }

        let public_url;
        try {
          // proxyUploadImage sends base64 to Lambda → Lambda uploads to S3 server-side.
          // This bypasses S3 CORS entirely (no direct browser → S3 PUT).
          public_url = await proxyUploadImage(sid, buf);
        } catch (e) {
          throw new Error('Photo ' + (i + 1) + ' upload failed — check your connection (' + e.message + ')');
        }

        productUrls.push(public_url);
      }

      const data = await enqueueTryon(config._id, mob, sid, productUrls);

      let result_url, itemId;
      if (data?.status === 'completed' && data?.result_url) {
        result_url = data.result_url;
        itemId     = data.tryon_id || ('sync_' + Date.now());
      } else {
        const jobId = data?.job_id;
        if (!jobId) throw new Error('No job ID returned');
        result_url = await pollForResult(jobId);
        itemId     = jobId;
      }

      stopCreeper(true);

      // New results are never expired — image_deleted: false
      const newItem = {
        id:                 itemId,
        result_url,
        image_deleted:      false,
        product_image_url:  productUrls[0],
        product_image_urls: productUrls,
        is_combo:           productUrls.length > 1,
        created_at:         new Date().toISOString(),
      };

      setAlbumItems(prev => [newItem, ...prev]);
      setTotalTryons(prev => prev + 1);
      setCurrentResult(newItem);
      setJustGenerated(true);
      showToast('Your look is ready! ✨');

      await new Promise(r => setTimeout(r, 300));

      if (isDesktopCall) { onDone(newItem); }
      else               { setCurrentScreen('result'); }
    } catch (e) {
      stopCreeper(false);
      showToast('Generation failed: ' + e.message);
      if (!isDesktopCall) setCurrentScreen('tryon');
    } finally {
      setIsGeneratingLocal(false);
      setIsGenerating(false);
    }
  }

  function startCreeper() {
    let p = 0;
    setGenProgress(0);
    genCreeper.current = setInterval(() => {
      p = Math.min(92, p + (p < 55 ? 2.4 : p < 80 ? 1.1 : 0.4));
      setGenProgress(p);
    }, 280);
  }

  function stopCreeper(success) {
    if (genCreeper.current) { clearInterval(genCreeper.current); genCreeper.current = null; }
    if (success) setGenProgress(100);
  }

  // User closes the generating screen — job keeps running in background.
  // Poll is still active in startGenerate(); when done it shows toast + navigates to result.
  function handleGeneratingClose() {
    setCurrentScreen('home');
    showToast("Still generating your look — we'll notify you when it's ready! 🔔");
  }

  function renderScreen() {
    switch (currentScreen) {
      case 'welcome':    return <WelcomeScreen onLogin={onLogin} />;
      case 'home':       return <HomeScreen />;
      case 'looks':         return <LooksScreen />;
      case 'notifications':  return <NotificationsScreen />;
      case 'tryon':      return <TryOnScreen onGenerate={startGenerate} isGenerating={isGeneratingLocal} />;
      case 'generating': return <GeneratingScreen progress={genProgress} onClose={handleGeneratingClose} />;
      case 'result':     return <ResultScreen justGenerated={justGenerated} />;
      case 'profile':    return <ProfileScreen />;
      case 'terms':      return <TermsScreen />;
      case 'privacy':    return <PrivacyScreen />;
      case 'help':       return <HelpScreen />;
      default:           return <HomeScreen />;
    }
  }

  return (
    <>
      {isDesktop && (
        <DesktopLayout
          loading={loading}
          onLogin={onLogin}
          startGenerate={startGenerate}
          genProgress={genProgress}
          isGenerating={isGeneratingLocal}
          justGenerated={justGenerated}
        />
      )}
      {!isDesktop && (
        <div className="app-frame">
          {loading && (
            <div className="loading-screen">
              <div className="load-ring" />
              <div className="load-text">Loading your boutique…</div>
            </div>
          )}
          {/* ── PIN gate — shown before any content ── */}
          {!loading && pinState === 'need_setup' && (
            <PinSetupScreen onDone={onPinVerified} />
          )}
          {!loading && pinState === 'need_entry' && (
            <PinEntryScreen onVerified={onPinVerified} />
          )}
          {/* ── Normal app — only shown once PIN is cleared ── */}
          {!loading && pinState !== 'need_setup' && pinState !== 'need_entry' && renderScreen()}
          {!loading && pinState !== 'need_setup' && pinState !== 'need_entry' && <BottomNav />}
          <BasePhotoOverlay />
          <ActionSheetOverlay />
          <DrawerOverlay />
          <ViewerOverlay />
          <Toast />
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
      <div className="page-badge">✦ <span>BoutiqueAI</span> · Virtual Try-On</div>
    </AppProvider>
  );
}
