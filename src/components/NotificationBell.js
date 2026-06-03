import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { fetchNotifications, markNotificationsRead } from '../api';

// Tiny beep using Web Audio API — no external file needed
function playNotifSound() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type      = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) { /* audio not supported */ }
}

function vibrate() {
  try { navigator.vibrate?.([100, 50, 100]); } catch (e) { /* not supported */ }
}

export default function NotificationBell({ onPress } = {}) {
  const { agentConfig, mobile, currentScreen, setCurrentScreen } = useApp();
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef                 = useRef(0);
  const intervalRef                   = useRef(null);

  // agentConfig._id is a string returned by /public/agent/:slug
  const agentId = agentConfig?._id || null;

  const poll = useCallback(async () => {
    if (!agentId || !mobile) return;
    try {
      const data  = await fetchNotifications(agentId, mobile);
      const count = data.unread_count || 0;

      // New notification arrived → sound + vibrate
      if (count > prevUnreadRef.current) {
        playNotifSound();
        vibrate();
      }
      prevUnreadRef.current = count;
      setUnreadCount(count);
    } catch (e) { /* silent */ }
  }, [agentId, mobile]);

  // Poll every 4 seconds — same as job poll, stays in sync
  useEffect(() => {
    if (!agentId || !mobile) return;
    poll(); // immediate
    intervalRef.current = setInterval(poll, 4000);
    return () => clearInterval(intervalRef.current);
  }, [agentId, mobile, poll]);

  // Reset badge when user opens notifications screen (mobile)
  useEffect(() => {
    if (currentScreen === 'notifications') {
      setUnreadCount(0);
      prevUnreadRef.current = 0;
    }
  }, [currentScreen]);

  function handleClick() {
    if (onPress) {
      // Desktop: caller handles the panel open; just clear the badge
      setUnreadCount(0);
      prevUnreadRef.current = 0;
      onPress();
    } else {
      // Mobile: navigate to notifications screen
      setCurrentScreen('notifications');
    }
  }

  return (
    <button
      className="notif-bell-btn"
      onClick={handleClick}
      aria-label="Notifications"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      {unreadCount > 0 && (
        <span className="notif-badge">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
