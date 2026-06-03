import { useApp } from '../context/AppContext';
import { deleteTryonApi } from '../api';

export default function ActionSheetOverlay() {
  const {
    showActionSheet, setShowActionSheet, actionSheetId,
    albumItems, setAlbumItems,
    mobile, showToast,
    setCurrentResult, setCurrentScreen,
  } = useApp();

  const item = albumItems.find(i => i.id === actionSheetId);

  function close() { setShowActionSheet(false); }

  function asView() {
    if (!item) return;
    setCurrentResult(item);
    setCurrentScreen('result');
    close();
  }

  async function asDelete() {
    if (!item || !window.confirm('Remove this look from your album?')) return;
    close();
    try { await deleteTryonApi(item.id, mobile); } catch (e) {}
    setAlbumItems(prev => prev.filter(i => i.id !== item.id));
    showToast('Removed from album');
  }

  return (
    <div className={`as-overlay${showActionSheet ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="as">
        <div className="sheet-grip" />
        <button className="as-i" onClick={asView}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          View Look
        </button>
        <button className="as-i danger" onClick={asDelete}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
          Remove
        </button>
      </div>
    </div>
  );
}
