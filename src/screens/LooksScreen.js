import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import LookCard from '../components/LookCard';
import { fetchAlbum } from '../api';
import { dayLabel } from '../utils';

const PAGE_SIZE = 50;

export default function LooksScreen() {
  const {
    agentConfig, mobile,
    albumItems, setAlbumItems,
    totalTryons,
    albumHasMore, setAlbumHasMore,
    setCurrentScreen, setCurrentResult,
    setShowActionSheet, setActionSheetId,
  } = useApp();

  const [loadingMore, setLoadingMore] = useState(false);

  function openResult(id) {
    const item = albumItems.find(i => i.id === id);
    // Don't navigate to result if image has been deleted
    if (item && !item.image_deleted) {
      setCurrentResult(item);
      setCurrentScreen('result');
    }
  }

  function openMenu(id) {
    setActionSheetId(id);
    setShowActionSheet(true);
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || !albumHasMore) return;
    setLoadingMore(true);
    try {
      const { tryons, has_more } = await fetchAlbum(
        agentConfig._id, mobile,
        { skip: albumItems.length, limit: PAGE_SIZE }
      );
      const newItems = tryons.map(t => ({
        id:                 t.id,
        result_url:         t.result_url,
        image_deleted:      t.image_deleted      || false,
        product_image_url:  t.product_image_url  || null,
        product_image_urls: t.product_image_urls || null,
        is_combo:           t.is_combo           || false,
        created_at:         t.created_at,
      }));
      setAlbumItems(prev => [...prev, ...newItems]);
      setAlbumHasMore(has_more);
    } catch (e) {
      console.warn('[loadMore]', e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, albumHasMore, albumItems.length, agentConfig, mobile, setAlbumItems, setAlbumHasMore]);

  // Group items by day label for section headers
  const groups = [];
  const seen   = {};
  albumItems.forEach(item => {
    const label = dayLabel(item.created_at);
    if (!seen[label]) { seen[label] = true; groups.push({ label, items: [] }); }
    groups[groups.length - 1].items.push(item);
  });

  const loaded  = albumItems.length;
  const hasMore = albumHasMore;

  return (
    <section className="screen active" id="screen-looks">
      <header className="app-header">
        <button className="hdr-btn" onClick={() => setCurrentScreen('home')} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="hdr-title">My Looks</div>
        <button className="hdr-btn" onClick={() => setCurrentScreen('tryon')} aria-label="New">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </header>

      <div className="screen-scroll">
        <div className="home-pad">

          {albumItems.length === 0 ? (
            <div className="empty">
              <div className="empty-emoji">👗</div>
              <div className="empty-t">No looks yet</div>
              <div className="empty-s">Upload a product photo to see how it looks on you instantly.</div>
              <button className="empty-cta" onClick={() => setCurrentScreen('tryon')}>+ Create your first look</button>
            </div>
          ) : (
            <>
              {/* Count bar */}
              <div className="looks-count-bar">
                <div className="looks-count-num">{totalTryons}</div>
                <div className="looks-count-lbl">
                  {totalTryons === 1 ? 'Look Generated' : 'Looks Generated'}
                </div>
                {hasMore && (
                  <div className="looks-count-showing">
                    Showing {loaded} of {totalTryons}
                  </div>
                )}
              </div>

              {/* Grouped grid */}
              {groups.map(group => (
                <div key={group.label} style={{ marginBottom: 24 }}>
                  <div className="looks-day-label">{group.label}</div>
                  <div className="look-grid">
                    {group.items.map((item, i) => (
                      <LookCard
                        key={item.id} item={item} index={i}
                        onOpen={openResult} onMenu={openMenu}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Load more */}
              {hasMore && (
                <button
                  className="looks-load-more"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore
                    ? <><div className="looks-load-ring" /> Loading…</>
                    : <>Load more  ·  {totalTryons - loaded} remaining</>
                  }
                </button>
              )}

              {/* All loaded message */}
              {!hasMore && totalTryons > PAGE_SIZE && (
                <div className="looks-all-loaded">
                  All {totalTryons} looks loaded ✓
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
