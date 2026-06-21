import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { deleteTryonApi, downloadTryonApi } from '../api';

export default function ResultScreen({ justGenerated }) {
  const {
    currentResult, setCurrentScreen,
    setAlbumItems,
    favSet, toggleFav, showToast, mobile, setViewerUrl,
  } = useApp();

  const carRef = useRef(null);
  const [dotIdx, setDotIdx] = useState(0);

  if (!currentResult) return null;
  const item = currentResult;
  const isFav = favSet.has(item.id);

  const prods  = item.product_image_urls || (item.product_image_url ? [item.product_image_url] : []);
  const slides = [{ url: item.result_url, main: true }, ...prods.map(u => ({ url: u, main: false }))];

  function onCarScroll() {
    if (!carRef.current || !carRef.current.firstElementChild) return;
    const idx = Math.round(
      carRef.current.scrollLeft / (carRef.current.firstElementChild.offsetWidth + 13)
    );
    setDotIdx(idx);
  }

  async function handleDownload() {
    showToast('Preparing download…');
    try {
      const data = await downloadTryonApi(item.id, mobile);
      if (data) {
        const bytes = Uint8Array.from(atob(data.image_b64), c => c.charCodeAt(0));
        const blob  = new Blob([bytes], { type: data.content_type || 'image/jpeg' });
        const href  = URL.createObjectURL(blob);
        const a     = document.createElement('a');
        const ts    = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
        a.href     = href;
        a.download = `boutiqueaitryon_${ts}.jpg`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(href), 8000);
        showToast('Downloaded! ✓');
        return;
      }
    } catch (e) {}
    window.open(item.result_url, '_blank');
  }

  async function handleDelete() {
    if (!window.confirm('Remove this look from your album?')) return;
    try { await deleteTryonApi(item.id, mobile); } catch (e) {}
    setAlbumItems(prev => prev.filter(i => i.id !== item.id));
    showToast('Removed from album');
    setCurrentScreen('home');
  }

  return (
    <section className="screen active" id="screen-result">
      <header className="app-header">
        <button className="hdr-btn" onClick={() => setCurrentScreen('home')} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="hdr-title">
          {justGenerated ? <>Look Ready <span style={{ color: 'var(--amber)' }}>✨</span></> : 'Your Look'}
        </div>
        {/* Empty slot keeps header title centred */}
        <div className="hdr-btn" />
      </header>

      <div className="screen-scroll">
        <div className="result-pad">

          {/* Success banner */}
          {justGenerated && (
            <div className="success-banner">
              <div className="success-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <div className="success-t">Your look is ready!</div>
                <div className="success-s">Automatically saved to your album.</div>
              </div>
            </div>
          )}

          {/* Carousel — images protected from drag/context menu */}
          <div className="carousel" ref={carRef} onScroll={onCarScroll}>
            {slides.map((s, i) => (
              <div className="car-slide" key={i}>
                {i === 0 && (
                  <div className="look-badge" style={{ position: 'absolute', top: 12, left: 12, zIndex: 3 }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 13, height: 13 }}>
                      <path d="M13 2L3 14h7l-1 8 10-12h-7z"/>
                    </svg>
                    LOOK
                  </div>
                )}
                <img src={s.url} alt=""
                  className="ss-protected"
                  draggable={false}
                  onContextMenu={e => e.preventDefault()}
                  onClick={() => setViewerUrl(s.url)}
                  onError={e => { e.target.style.opacity = '.3'; }}
                />
                {i !== 0 && (
                  <button className={`car-fav${isFav ? ' on' : ''}`} onClick={() => toggleFav(item.id)}>
                    <svg viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth="2">
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="car-dots">
            {slides.map((_, i) => (
              <div key={i} className={`dot${dotIdx === i ? ' on' : ''}`} />
            ))}
          </div>

          {/* Outfit details */}
          <div className="detail-card">
            <div className="detail-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="detail-t">Outfit Details</div>
              <div className="detail-s">
                {prods.length > 1 ? `${prods.length} items combined` : 'AI Virtual Try-On Look'}
              </div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
              style={{ width: 18, height: 18, color: 'var(--ink-3)' }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>

          {/* Actions — Download and Share removed */}
          <div className="ask-title">What would you like to do?</div>
          <div className="action-grid">
            <button className="action" onClick={handleDownload}>
              <div className="action-ic" style={{ background: 'rgba(16,185,129,.1)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ color: '#10b981' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <span>Download</span>
            </button>
            <button className="action" onClick={() => setCurrentScreen('tryon')}>
              <div className="action-ic" style={{ background: 'var(--brand-soft)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ color: 'var(--brand)' }}>
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                </svg>
              </div>
              <span>Generate Again</span>
            </button>
            <button className="action" onClick={() => toggleFav(item.id)}>
              <div className="action-ic"
                style={{ background: isFav ? 'rgba(244,63,94,.1)' : 'rgba(244,63,94,.08)' }}>
                <svg viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'}
                  stroke="currentColor" strokeWidth="2" style={{ color: '#f43f5e' }}>
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
                </svg>
              </div>
              <span>{isFav ? 'Favorited' : 'Favorite'}</span>
            </button>
          </div>

          {/* Saved card */}
          <div className="saved-card" style={{ cursor: 'pointer' }}
            onClick={() => setCurrentScreen('looks')}>
            <div className="saved-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="saved-t">Saved to Album Automatically</div>
              <div className="saved-s">View all your looks in the Looks section.</div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
              style={{ width: 18, height: 18, color: 'var(--ink-3)', flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>

          {/* Delete */}
          <button onClick={handleDelete} style={{
            width: '100%', padding: '14px', borderRadius: 14, marginTop: 8,
            background: 'rgba(224,53,75,.06)', border: '1px solid rgba(224,53,75,.15)',
            color: 'var(--red)', fontSize: 14.5, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Remove from Album
          </button>

        </div>
      </div>
    </section>
  );
}
