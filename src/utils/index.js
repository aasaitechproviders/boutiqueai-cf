export function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
}

export function darken(hex, pct) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const f = 1 - pct / 100;
  const h = v => Math.max(0, Math.round(v * f)).toString(16).padStart(2, '0');
  return '#' + h(rgb.r) + h(rgb.g) + h(rgb.b);
}

export function genId() {
  return 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function resizeImageFile(file, maxPx = 1024) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale  = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        // Always output image/jpeg regardless of input format (PNG, WebP, HEIC, etc.)
        // so the content-type used for presign always matches the uploaded blob.
        if (canvas.toBlob) {
          canvas.toBlob(b => {
            if (b) { res(b); }
            else {
              // iOS Safari fallback: toBlob returned null — use toDataURL instead
              try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                const byteStr = atob(dataUrl.split(',')[1]);
                const arr = new Uint8Array(byteStr.length);
                for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
                res(new Blob([arr], { type: 'image/jpeg' }));
              } catch (fallbackErr) { rej(new Error('Image conversion failed')); }
            }
          }, 'image/jpeg', 0.88);
        } else {
          // Very old Safari: toBlob not available at all
          try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            const byteStr = atob(dataUrl.split(',')[1]);
            const arr = new Uint8Array(byteStr.length);
            for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
            res(new Blob([arr], { type: 'image/jpeg' }));
          } catch (fallbackErr) { rej(new Error('Image conversion failed')); }
        }
      };
      img.onerror = rej;
      img.src = e.target.result;
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

export function dayLabel(dateStr) {
  const d = new Date(dateStr), now = new Date();
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === y.toDateString())   return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function timeOf(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function filterItems(items, filter) {
  if (filter === 'all') return items;
  const now = new Date();
  return items.filter(it => {
    const d = new Date(it.created_at);
    if (filter === 'today')     return d.toDateString() === now.toDateString();
    if (filter === 'yesterday') { const y = new Date(now); y.setDate(now.getDate() - 1); return d.toDateString() === y.toDateString(); }
    if (filter === 'week')      { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
    return true;
  });
}

// Brand colour is now fixed via CSS tokens — no runtime override needed
