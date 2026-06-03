export const API = 'https://ekbg3nf6b6vr6i3ssxxni3g6ia0jwcwm.lambda-url.ap-southeast-2.on.aws';
export const SUBDOMAIN_BASE = 'boutiquesaas.aasaitech.in';
export const CLIENT_MAX_PX = 1024;

const fetchWithTimeout = (url, opts = {}, ms = 10000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
};

export function getSlug() {
  const h = window.location.hostname;
  const p = new URLSearchParams(window.location.search);
  if (p.get('slug'))  return { slug: p.get('slug'),  mode: 'slug' };
  if (p.get('agent')) return { slug: p.get('agent'), mode: 'slug' };
  if (h.endsWith('.' + SUBDOMAIN_BASE)) return { slug: h.replace('.' + SUBDOMAIN_BASE, ''), mode: 'slug' };
  if (h === 'localhost' || h.endsWith('.pages.dev')) return { slug: p.get('slug') || 'demo', mode: 'slug' };
  return { domain: h, mode: 'domain' };
}

export async function fetchAgent(ref) {
  const url = ref.mode === 'slug'
    ? `${API}/public/agent/${ref.slug}`
    : `${API}/public/agent/by-domain?domain=${encodeURIComponent(ref.domain)}`;
  const res  = await fetchWithTimeout(url);
  const json = await res.json();
  if (!json.success || !json.data) throw new Error(json.error || 'Agent not found');
  return json.data;
}

export async function identifyCustomer(agentId, mobile) {
  const res  = await fetch(`${API}/public/customer/identify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, mobile }),
  });
  const json = await res.json();
  if (json.success && json.data) return json.data;
  return {};
}

export async function fetchAlbum(agentId, mobile, { skip = 0, limit = 50 } = {}) {
  const res  = await fetch(`${API}/public/album?agent_id=${agentId}&mobile=${encodeURIComponent(mobile)}&skip=${skip}&limit=${limit}`);
  const json = await res.json();
  if (json.success && json.data?.tryons) {
    return {
      tryons:   json.data.tryons,
      total:    json.data.total   ?? json.data.tryons.length,
      has_more: json.data.has_more ?? false,
    };
  }
  return { tryons: [], total: 0, has_more: false };
}

// ─── Proxy upload: sends base64 image to Lambda → Lambda uploads to S3 ──────
// This replaces the old presign + direct S3 PUT flow.
// Direct browser→S3 PUT requires S3 bucket CORS to be configured.
// Android Chrome and iOS Safari strictly enforce CORS preflight on S3 PUTs,
// causing "fetch failed" on real devices even when DevTools works fine.
// Routing through the Lambda (which already has CORS *) fixes this permanently.
export async function proxyUploadImage(sessionId, blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result; // data:image/jpeg;base64,...
        const res = await fetch(`${API}/public/upload/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id:   sessionId,
            image_base64: base64,
            content_type: 'image/jpeg',
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Upload failed');
        resolve(json.data.public_url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(blob);
  });
}

// Legacy: kept for backward-compat (BasePhotoOverlay still calls this path)
export async function presignUpload(sessionId, contentType) {
  const res  = await fetch(`${API}/public/upload/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, content_type: contentType }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Presign failed');
  return json.data; // { upload_url, public_url }
}

export function uploadToS3(uploadUrl, blob, contentType) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) { resolve(); }
      else { reject(new Error('Photo upload failed (' + xhr.status + ') — please try again')); }
    };
    xhr.onerror  = () => reject(new Error('Photo upload failed — check your connection and try again'));
    xhr.ontimeout = () => reject(new Error('Photo upload timed out — check your connection'));
    xhr.timeout  = 60000;
    xhr.send(blob);
  });
}

export async function saveBaseImage(agentId, mobile, baseImageUrl) {
  const res  = await fetch(`${API}/public/customer/base-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, mobile, base_image_url: baseImageUrl }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Save failed');
  return json.data;
}

export async function enqueueTryon(agentId, mobile, sessionId, productImageUrls) {
  const res  = await fetch(`${API}/public/tryon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, mobile, session_id: sessionId, product_image_urls: productImageUrls }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to queue try-on');
  return json.data;
}

export function pollForResult(jobId) {
  return new Promise((resolve, reject) => {
    const POLL = 4000, MAX = 3 * 60 * 1000, started = Date.now();
    const timer = setInterval(async () => {
      try {
        if (Date.now() - started > MAX) {
          clearInterval(timer);
          reject(new Error('Try-on timed out — please try again'));
          return;
        }
        const res  = await fetch(`${API}/public/tryon/status/${jobId}`);
        const json = await res.json();
        if (!json.success) return;
        const { status, result_url, error } = json.data;
        if (status === 'completed' && result_url) { clearInterval(timer); resolve(result_url); }
        else if (status === 'failed') { clearInterval(timer); reject(new Error(error || 'Try-on generation failed')); }
      } catch (err) { console.warn('[poll] retry', err.message); }
    }, POLL);
  });
}

export async function downloadTryonApi(id, mobile) {
  const res  = await fetch(`${API}/public/download/${id}?mobile=${encodeURIComponent(mobile)}`);
  const json = await res.json();
  if (json.success && json.data?.image_b64) return json.data;
  return null;
}

export async function deleteTryonApi(id, mobile) {
  await fetch(`${API}/public/album/${id}?mobile=${encodeURIComponent(mobile)}`, { method: 'DELETE' });
}

// ── Notifications ─────────────────────────────────────────────────────────

export async function fetchNotifications(agentId, mobile) {
  const res  = await fetch(`${API}/public/notifications?agent_id=${agentId}&mobile=${encodeURIComponent(mobile)}`);
  const json = await res.json();
  if (!json.success) return { notifications: [], unread_count: 0 };
  return json.data;
}

export async function markNotificationsRead(agentId, mobile, notificationId = null) {
  const body = { agent_id: agentId, mobile };
  if (notificationId) body.notification_id = notificationId;
  await fetch(`${API}/public/notifications/read`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
}

// ── PIN ───────────────────────────────────────────────────────────────────

export async function checkPinStatus(agentId, mobile) {
  const res  = await fetch(`${API}/public/customer/check-pin-status`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ agent_id: agentId, mobile }),
  });
  const json = await res.json();
  if (json.success) return json.data;   // { has_pin: bool }
  return { has_pin: false };
}

export async function setPin(agentId, mobile, pin, securityQuestion, securityAnswer) {
  const res  = await fetch(`${API}/public/customer/set-pin`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ agent_id: agentId, mobile, pin, security_question: securityQuestion, security_answer: securityAnswer }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to set PIN');
  return json.data;
}

export async function verifyPin(agentId, mobile, pin) {
  const res  = await fetch(`${API}/public/customer/verify-pin`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ agent_id: agentId, mobile, pin }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Verification failed');
  return json.data;   // { verified, locked, locked_until, seconds_left, attempts_left }
}

export async function getSecurityQuestion(agentId, mobile) {
  const res  = await fetch(`${API}/public/customer/get-security-question`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ agent_id: agentId, mobile }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Could not fetch question');
  return json.data;   // { security_question, locked, seconds_left }
}

export async function verifySecurityAnswer(agentId, mobile, answer) {
  const res  = await fetch(`${API}/public/customer/verify-security-answer`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ agent_id: agentId, mobile, answer }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Verification failed');
  return json.data;   // { verified, locked, seconds_left, attempts_left }
}
