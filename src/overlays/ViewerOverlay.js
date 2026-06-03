import { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function ViewerOverlay() {
  const { viewerUrl, setViewerUrl } = useApp();

  const [scale, setScale]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const gestureRef  = useRef(null);   // current active gesture state
  const lastTapRef  = useRef(0);      // timestamp of previous tap (double-tap detection)
  const scaleRef    = useRef(1);      // mirror of scale for use inside touch handlers
  const offsetRef   = useRef({ x: 0, y: 0 });

  // keep refs in sync with state
  useEffect(() => { scaleRef.current  = scale;  }, [scale]);
  useEffect(() => { offsetRef.current = offset; }, [offset]);

  // reset on open / close
  useEffect(() => {
    if (!viewerUrl) { setScale(1); setOffset({ x: 0, y: 0 }); }
  }, [viewerUrl]);

  function close() { setViewerUrl(null); }

  function resetZoom() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    gestureRef.current = null;
  }

  function dist2(a, b) {
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  }

  function onTouchStart(e) {
    e.stopPropagation();

    if (e.touches.length === 2) {
      // Start pinch
      gestureRef.current = {
        type:       'pinch',
        startDist:  dist2(e.touches[0], e.touches[1]),
        startScale: scaleRef.current,
        startOffX:  offsetRef.current.x,
        startOffY:  offsetRef.current.y,
      };
      return;
    }

    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300 && lastTapRef.current !== 0) {
        // Double-tap: toggle zoom
        lastTapRef.current = 0;
        if (scaleRef.current > 1.1) { resetZoom(); }
        else { setScale(2.5); }
        return;
      }
      lastTapRef.current = now;

      // Start pan (only meaningful when zoomed)
      gestureRef.current = {
        type:     'pan',
        startX:   e.touches[0].clientX,
        startY:   e.touches[0].clientY,
        startOffX: offsetRef.current.x,
        startOffY: offsetRef.current.y,
      };
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    e.stopPropagation();
    const g = gestureRef.current;
    if (!g) return;

    if (g.type === 'pinch' && e.touches.length >= 2) {
      const d        = dist2(e.touches[0], e.touches[1]);
      const newScale = Math.max(1, Math.min(5, g.startScale * (d / g.startDist)));
      setScale(newScale);
      if (newScale <= 1) setOffset({ x: 0, y: 0 });
    }

    if (g.type === 'pan' && e.touches.length === 1 && scaleRef.current > 1.05) {
      setOffset({
        x: g.startOffX + e.touches[0].clientX - g.startX,
        y: g.startOffY + e.touches[0].clientY - g.startY,
      });
    }
  }

  function onTouchEnd(e) {
    e.stopPropagation();
    if (e.touches.length === 0) {
      gestureRef.current = null;
      if (scaleRef.current < 1.05) resetZoom();
    }
  }

  const isZoomed = scale > 1.05;

  return (
    <div
      className={`viewer${viewerUrl ? ' show' : ''}`}
      onClick={e => { if (e.target === e.currentTarget && !isZoomed) close(); }}
      style={{ overflow: 'hidden', cursor: isZoomed ? 'grab' : 'default' }}
    >
      {/* Close button */}
      <button className="viewer-close" onClick={close} style={{ zIndex: 10 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Scale badge */}
      {isZoomed && (
        <div className="viewer-scale-badge">{scale.toFixed(1)}×</div>
      )}

      {/* Hint */}
      {viewerUrl && !isZoomed && (
        <div className="viewer-hint">Pinch or double-tap to zoom</div>
      )}

      {viewerUrl && (
        <img
          src={viewerUrl}
          alt=""
          className="viewer-img"
          style={{
            transform:        `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin:  'center center',
            transition:       gestureRef.current ? 'none' : 'transform .22s ease',
            touchAction:      'none',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={e => e.stopPropagation()}
          draggable={false}
          onContextMenu={e => e.preventDefault()}
        />
      )}
    </div>
  );
}
