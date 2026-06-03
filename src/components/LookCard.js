import { timeOf } from '../utils';

export default function LookCard({ item, index, onOpen, onMenu }) {
  return (
    <div
      className="look-card"
      style={{ animation: `fadeUp .3s ${index * 45}ms both` }}
      onClick={() => onOpen(item.id)}
    >
      <img
        className="look-card-img"
        src={item.result_url}
        alt=""
        loading="lazy"
        onError={e => { e.target.style.opacity = '.3'; }}
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
