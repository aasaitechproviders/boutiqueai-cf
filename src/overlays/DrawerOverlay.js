import { useApp } from '../context/AppContext';

export default function DrawerOverlay() {
  const { showDrawer, setShowDrawer, agentConfig, setCurrentScreen, signOut } = useApp();

  const name = agentConfig?.agent_name || agentConfig?.business_name || 'Boutique';
  const logo = agentConfig?.logo_url || null;

  function close() { setShowDrawer(false); }
  function goTo(screen) { setCurrentScreen(screen); setShowDrawer(false); }

  const quickActions = [
    {
      screen: 'tryon',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
      label: 'New Try-On',
      color: '#C9A84C',
    },
    {
      screen: 'looks',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
      label: 'My Looks',
      color: '#5BB8A0',
    },
    {
      screen: 'home',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
      label: 'Home',
      color: '#A07ECC',
    },
    {
      screen: 'profile',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      label: 'Profile',
      color: '#E8845A',
    },
    {
      screen: 'help',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17" strokeWidth="2.5" strokeLinecap="round"/></svg>,
      label: 'Help & Support',
      color: '#5BB8A0',
    },
    {
      screen: 'terms',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
      label: 'Terms of Service',
      color: '#6BB5E8',
    },
    {
      screen: 'privacy',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
      label: 'Privacy Policy',
      color: '#E86FA0',
    },
  ];

  const features = [
    { icon: '👗', title: 'Sarees & Silk',  desc: 'Traditional & designer sarees',  color: '#C9A84C', bg: 'rgba(201,168,76,.12)' },
    { icon: '🥻', title: 'Kurtis & Sets',  desc: 'Ethnic tops & co-ord sets',       color: '#5BB8A0', bg: 'rgba(91,184,160,.12)' },
    { icon: '👚', title: 'Western Wear',   desc: 'Tops, dresses & casuals',         color: '#A07ECC', bg: 'rgba(160,126,204,.12)' },
    { icon: '🧥', title: 'Occasion Wear',  desc: 'Party, wedding & formal',         color: '#E8845A', bg: 'rgba(232,132,90,.12)' },
    { icon: '💍', title: 'Jewellery',      desc: 'Necklaces, earrings & more',      color: '#E86FA0', bg: 'rgba(232,111,160,.12)' },
    { icon: '👜', title: 'Accessories',    desc: 'Bags, scarves & extras',          color: '#6BB5E8', bg: 'rgba(107,181,232,.12)' },
  ];

  return (
    <div
      className={`drawer-overlay${showDrawer ? ' show' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="drawer-v2">

        {/* Header */}
        <div className="drw-head">
          <div className="drw-logo">
            {logo ? <img src={logo} alt="" /> : <span>{(name[0] || 'B').toUpperCase()}</span>}
          </div>
          <div className="drw-head-txt">
            <div className="drw-bname">{name}</div>
            <div className="drw-tagline">Virtual Try-On Studio</div>
          </div>
          <button className="drw-close" onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="drw-scroll">

          {/* Quick Actions */}
          <div className="drw-section-label">Quick Actions</div>
          <div className="drw-actions-list">
            {quickActions.map(a => (
              <button key={a.screen} className="drw-action-row" onClick={() => goTo(a.screen)}
                style={{ '--ac': a.color }}>
                <div className="drw-action-icon-sm">{a.icon}</div>
                <span className="drw-action-label-sm">{a.label}</span>
                <svg className="drw-action-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}
          </div>

          {/* What you can try — 2x3 feature cards grid */}
          <div className="drw-section-label" style={{ marginTop: 20 }}>What You Can Try On</div>
          <div className="drw-features-grid">
            {features.map(f => (
              <div key={f.title} className="drw-feat-card"
                style={{ '--fc': f.color, '--fb': f.bg }}>
                <span className="drw-feat-emoji">{f.icon}</span>
                <div className="drw-feat-title">{f.title}</div>
                <div className="drw-feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Sign out */}
          <button className="drw-signout" onClick={() => { close(); signOut(); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>

        </div>
      </div>
    </div>
  );
}
