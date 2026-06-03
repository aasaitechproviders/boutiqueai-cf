import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const AppContext = createContext(null);

// Screens that participate in browser history (mobile only)
// 'loading' and 'generating' are transient UI states — not navigable
const HISTORY_SCREENS = new Set(['welcome', 'home', 'tryon', 'looks', 'result', 'profile']);

export function AppProvider({ children }) {
  // Config & auth
  const [agentConfig, setAgentConfig] = useState(null);
  const [mobile, setMobile] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Base photo
  const [hasBaseImage, setHasBaseImage] = useState(false);
  const [baseImageUrl, setBaseImageUrl] = useState(null);
  const [styleProfile, setStyleProfile] = useState(null);

  // Album
  const [albumItems,   setAlbumItems]   = useState([]);
  const [totalTryons,  setTotalTryons]  = useState(0);
  const [albumHasMore, setAlbumHasMore] = useState(false);

  // ── Navigation with browser History API ─────────────────
  // Raw React state — only set directly for popstate (no extra history push)
  const [currentScreen, _setScreen] = useState('loading');

  // Tracks whether we've done the first real navigation yet.
  // First nav uses replaceState (so back doesn't exit the SPA immediately).
  // All subsequent navs use pushState.
  const historyInitDone = useRef(false);

  // Public setter — used everywhere in the app.
  // Pushes to browser history so back button works.
  const setCurrentScreen = useCallback((screen) => {
    _setScreen(screen);

    // Only manage history on mobile layout (desktop has its own tab/modal system)
    // and only for screens that make sense as navigable URLs
    if (!HISTORY_SCREENS.has(screen) || window.innerWidth >= 960) return;

    const state = { screen };
    const hash  = '#' + screen;

    if (!historyInitDone.current) {
      // Replace the very first entry so pressing back from the first
      // screen goes to whatever was before (correct SPA behaviour)
      window.history.replaceState(state, '', hash);
      historyInitDone.current = true;
    } else {
      window.history.pushState(state, '', hash);
    }
  }, []);

  // Handle browser back / forward button
  useEffect(() => {
    function onPopState(e) {
      // Only active on mobile layout
      if (window.innerWidth >= 960) return;

      const screen = e.state?.screen
        ?? window.location.hash.replace('#', '');

      if (HISTORY_SCREENS.has(screen)) {
        _setScreen(screen); // raw setter — don't push another history entry
      } else {
        // Fallback: landed on a state-less entry (e.g. very first page load)
        // Stay on home rather than letting the browser navigate away
        _setScreen('home');
        window.history.replaceState({ screen: 'home' }, '', '#home');
      }
    }

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []); // runs once on mount

  // Favorites (persisted to localStorage)
  const [favSet, setFavSet] = useState(() => {
    try {
      const raw = localStorage.getItem('ba_fav_');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  // Toast
  const [toastMsg, setToastMsg]       = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);

  // Current result (result screen)
  const [currentResult, setCurrentResult] = useState(null);

  // Try-on state
  const [productFiles, setProductFiles] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Overlays
  const [showBaseModal, setShowBaseModal]     = useState(false);
  const [baseModalContext, setBaseModalContext] = useState('init');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [actionSheetId, setActionSheetId]     = useState(null);
  const [showDrawer, setShowDrawer]           = useState(false);
  const [viewerUrl, setViewerUrl]             = useState(null);

  // Filter
  const [currentFilter, setCurrentFilter] = useState('all');

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2800);
  }, []);

  const saveFavs = useCallback((set, agentId) => {
    try {
      localStorage.setItem('ba_fav_' + (agentId || ''), JSON.stringify([...set]));
    } catch (e) {}
  }, []);

  const loadFavs = useCallback((agentId) => {
    try {
      const raw = localStorage.getItem('ba_fav_' + (agentId || ''));
      setFavSet(new Set(raw ? JSON.parse(raw) : []));
    } catch { setFavSet(new Set()); }
  }, []);

  const toggleFav = useCallback((id) => {
    setFavSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Removed from favorites');
      } else {
        next.add(id);
        showToast('Added to favorites ♥');
      }
      saveFavs(next, agentConfig?._id);
      return next;
    });
  }, [agentConfig, saveFavs, showToast]);

  const signOut = useCallback(() => {
    if (!window.confirm('Sign out? You will need to re-enter your mobile number.')) return;
    localStorage.removeItem('ba_mobile');
    localStorage.removeItem('ba_agent_id');
    setMobile(null);
    setHasBaseImage(false);
    setBaseImageUrl(null);
    setStyleProfile(null);
    setAlbumItems([]);
    setCurrentScreen('welcome');
  }, [setCurrentScreen]);

  return (
    <AppContext.Provider value={{
      agentConfig, setAgentConfig,
      mobile, setMobile,
      sessionId, setSessionId,
      hasBaseImage, setHasBaseImage,
      baseImageUrl, setBaseImageUrl,
      styleProfile, setStyleProfile,
      albumItems, setAlbumItems,
      totalTryons, setTotalTryons,
      albumHasMore, setAlbumHasMore,
      currentScreen, setCurrentScreen,
      favSet, toggleFav, loadFavs, saveFavs,
      toastMsg, toastVisible, showToast,
      currentResult, setCurrentResult,
      productFiles, setProductFiles,
      isGenerating, setIsGenerating,
      showBaseModal, setShowBaseModal,
      baseModalContext, setBaseModalContext,
      showActionSheet, setShowActionSheet,
      actionSheetId, setActionSheetId,
      showDrawer, setShowDrawer,
      viewerUrl, setViewerUrl,
      currentFilter, setCurrentFilter,
      signOut,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
