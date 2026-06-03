import { useApp } from '../context/AppContext';
import NotificationBell from '../components/NotificationBell';
import { dayLabel, filterItems } from '../utils';
import LookCard from '../components/LookCard';

const FILTERS = [
  { key: 'all', label: 'All Looks' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
];

export default function HomeScreen() {
  const {
    agentConfig, albumItems, totalTryons, currentFilter, setCurrentFilter,
    setCurrentScreen, setShowActionSheet, setActionSheetId,
    setCurrentResult, setShowDrawer, showToast,
  } = useApp();

  const name = agentConfig?.agent_name || agentConfig?.business_name || 'Boutique';
  const logo = agentConfig?.logo_url || null;

  function openResult(id) {
    const item = albumItems.find(i => i.id === id);
    if (item) { setCurrentResult(item); setCurrentScreen('result'); }
  }

  function openMenu(id) {
    setActionSheetId(id);
    setShowActionSheet(true);
  }

  const items = filterItems(albumItems, currentFilter);

  // Group by day label
  const order = [], groups = {};
  items.forEach(it => {
    const l = dayLabel(it.created_at);
    if (!groups[l]) { groups[l] = []; order.push(l); }
    groups[l].push(it);
  });

  return (
    <section className={`screen${['home'].includes('home') ? '' : ''} active`} id="screen-home">
      <header className="app-header">
        <button className="hdr-btn" onClick={() => setShowDrawer(true)} aria-label="Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="hdr-brand">
          <div className="hdr-logo">
            {logo ? <img src={logo} alt="" /> : (name[0] || 'B').toUpperCase()}
          </div>
          <div className="hdr-brand-name">{name}</div>
        </div>
        <NotificationBell />
      </header>

      <div className="screen-scroll">
        <div className="home-pad">
          <div className="stat-row">
            <div className="stat-card">
              <div className="stat-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6 6.9 18.2l1.9-5.8L4 8.8h6.1z"/>
                </svg>
              </div>
              <div>
                <div className="stat-num">{totalTryons}</div>
                <div className="stat-lbl">Looks Generated</div>
              </div>
            </div>
            <button className="new-btn" onClick={() => setCurrentScreen('tryon')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Try-On
            </button>
          </div>

          <div className="chips">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`chip${currentFilter === f.key ? ' active' : ''}`}
                onClick={() => setCurrentFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {items.length === 0 ? (
            <EmptyState onTryon={() => setCurrentScreen('tryon')} />
          ) : (
            order.map(label => (
              <div key={label}>
                <div className="section-head">
                  <div className="section-title">{label}</div>
                  <button className="see-all" onClick={() => setCurrentScreen('looks')}>
                    See all
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
                <div className="look-row">
                  {groups[label].map((item, i) => (
                    <LookCard key={item.id} item={item} index={i} onOpen={openResult} onMenu={openMenu} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyState({ onTryon }) {
  return (
    <div className="empty">
      <div className="empty-emoji">👗</div>
      <div className="empty-t">No looks yet</div>
      <div className="empty-s">Upload a product photo to see how it looks on you instantly.</div>
      <button className="empty-cta" onClick={onTryon}>+ Create your first look</button>
    </div>
  );
}
