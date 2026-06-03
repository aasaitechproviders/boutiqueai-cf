import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { fetchNotifications, markNotificationsRead } from '../api';

export default function NotificationsScreen() {
  const { currentScreen, setCurrentScreen, agentConfig, mobile } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  // agentConfig._id is a string returned by /public/agent/:slug
  const agentId = agentConfig?._id || null;

  const load = useCallback(async () => {
    if (!agentId || !mobile) return;
    try {
      const data = await fetchNotifications(agentId, mobile);
      setNotifications(data.notifications || []);
    } catch (e) {
      console.warn('[Notifications] load error', e.message);
    } finally {
      setLoading(false);
    }
  }, [agentId, mobile]);

  // Load + mark all read when screen opens
  useEffect(() => {
    if (currentScreen !== 'notifications') return;
    setLoading(true);
    load().then(() => {
      if (agentId && mobile) markNotificationsRead(agentId, mobile).catch(() => {});
    });
  }, [currentScreen, load, agentId, mobile]);

  if (currentScreen !== 'notifications') return null;

  return (
    <section className="screen screen-notifications active">
      {/* Header */}
      <div className="notif-header">
        <button className="notif-back" onClick={() => setCurrentScreen('home')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="notif-title">Notifications</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Body */}
      <div className="notif-body">
        {loading ? (
          <div className="notif-empty">
            <div className="notif-loading-ring" />
            <p>Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">🔔</div>
            <h3>No notifications yet</h3>
            <p>We'll notify you when your try-on is ready</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map(n => (
              <NotifCard
                key={n._id}
                notif={n}
                onView={() => setCurrentScreen('looks')}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NotifCard({ notif, onView }) {
  const isCompleted = notif.type === 'completed';
  const timeAgo     = getTimeAgo(notif.created_at);

  return (
    <div className={`notif-card${notif.read ? '' : ' notif-card--unread'}`}>
      {/* Unread dot */}
      {!notif.read && <div className="notif-unread-dot" />}

      {/* Thumbnail or icon */}
      <div className="notif-card-left">
        {isCompleted && notif.thumbnail_url ? (
          <img className="notif-thumb" src={notif.thumbnail_url} alt="" />
        ) : (
          <div className={`notif-icon-circle notif-icon-circle--${notif.type}`}>
            {isCompleted
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
          </div>
        )}
      </div>

      {/* Content */}
      <div className="notif-card-content">
        <div className="notif-card-title">{notif.title}</div>
        <div className="notif-card-body">{notif.body}</div>
        <div className="notif-card-time">{timeAgo}</div>
      </div>

      {/* Action */}
      {isCompleted && (
        <button className="notif-view-btn" onClick={onView}>
          View
        </button>
      )}
    </div>
  );
}

function getTimeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
