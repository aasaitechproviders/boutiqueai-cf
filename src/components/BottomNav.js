import { useApp } from '../context/AppContext';

const TAB_SCREENS = ['home', 'tryon', 'looks', 'profile'];

export default function BottomNav() {
  const { currentScreen, setCurrentScreen } = useApp();
  const visible = TAB_SCREENS.includes(currentScreen);

  return (
    <nav className={`bottom-nav${visible ? ' show' : ''}`}>
      <button className={`nav-i${currentScreen === 'home' ? ' active' : ''}`} onClick={() => setCurrentScreen('home')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Home</span>
      </button>

      <button className={`nav-i${currentScreen === 'tryon' ? ' active' : ''}`} onClick={() => setCurrentScreen('tryon')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/>
        </svg>
        <span>Try-On</span>
      </button>

      <button className={`nav-i${currentScreen === 'looks' ? ' active' : ''}`} onClick={() => setCurrentScreen('looks')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>Looks</span>
      </button>

      <button className={`nav-i${currentScreen === 'profile' ? ' active' : ''}`} onClick={() => setCurrentScreen('profile')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Profile</span>
      </button>
    </nav>
  );
}
