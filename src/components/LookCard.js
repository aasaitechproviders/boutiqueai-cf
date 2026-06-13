import { useState } from 'react';
import { timeOf } from '../utils';

export default function LookCard({ item, index, onOpen, onMenu }) {

  // ── Expired state — image deleted from S3 ─────────────────────────────────
  if (item.image_deleted) {
    return (
      <div
        className="look-card look-card--expired"
        style={{ animation: `fadeUp .3s ${index * 45}ms both` }}
      >
        <div className="look-card-expired-body">
          <svg
            className="look-card-expired-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <div className="look-card-expired-label">Look Expired</div>
        </div>
        <button
          className="look-menu"
          onClick={e => { e.stopPropagation(); onMenu(item.id); }}
          aria-label="Options"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5"  r="1.7"/>
            <circle cx="12" cy="12" r="1.7"/>
            <circle cx="12" cy="19" r="1.7"/>
          </svg>
        </button>
        <div className="look-footer">
          <div className="look-time">{timeOf(item.created_at)}</div>
        </div>
      </div>
    );
  }

  // ── Normal state — shimmer while image loads ──────────────────────────────
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      className="look-card"
      style={{ animation: `fadeUp .3s ${index * 45}ms both` }}
      onClick={() => onOpen(item.id)}
    >
      {/* Shimmer shown until image finishes loading */}
      {!imgLoaded && <div className="look-card-shimmer" />}

      <img
        className="look-card-img"
        src={item.result_url}
        alt=""
        loading="lazy"
        style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity .3s ease' }}
        onLoad={() => setImgLoaded(true)}
        onError={e => { e.target.style.opacity = '.3'; setImgLoaded(true); }}
      />
      <div className="look-badge">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2L3 14h7l-1 8 10-12h-7z"/>
        </svg>
        LOOK
      </div>
      <button
        className="look-menu"
        onClick={e => { e.stopPropagation(); onMenu(item.id); }}
        aria-label="Options"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5"  r="1.7"/>
          <circle cx="12" cy="12" r="1.7"/>
          <circle cx="12" cy="19" r="1.7"/>
        </svg>
      </button>
      <div className="look-footer">
        <div className="look-time">{timeOf(item.created_at)}</div>
      </div>
    </div>
  );
}
