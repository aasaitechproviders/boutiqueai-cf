import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { proxyUploadImage, saveBaseImage } from '../api';
import { resizeImageFile } from '../utils';
import { CLIENT_MAX_PX } from '../api';

export default function BasePhotoOverlay() {
  const {
    showBaseModal, setShowBaseModal, baseModalContext,
    agentConfig, mobile, sessionId,
    hasBaseImage, baseImageUrl,
    setHasBaseImage, setBaseImageUrl, setStyleProfile,
    showToast,
  } = useApp();

  const fileInputRef = useRef(null);
  const [selected,  setSelected]  = useState(null); // { file, base64 }
  const [uploading, setUploading] = useState(false);

  function close() {
    setShowBaseModal(false);
    setSelected(null);
  }

  function onFileSelected(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setSelected({ file, base64: ev.target.result });
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (!selected || uploading) return;
    setUploading(true);
    try {
      const buf = await resizeImageFile(selected.file, CLIENT_MAX_PX);
      // proxyUploadImage → Lambda uploads to S3 server-side (no S3 CORS needed)
      const public_url = await proxyUploadImage(sessionId, buf);
      const data = await saveBaseImage(agentConfig._id, mobile, public_url);
      setHasBaseImage(true);
      setBaseImageUrl(public_url);
      setStyleProfile(data?.style_profile || null);
      showToast('Photo saved! ✓');
      close();
    } catch (e) {
      showToast('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  }

  const showCancel = baseModalContext !== 'init' || hasBaseImage;

  // What to show in the photo area:
  // 1. New photo just picked  → preview of new selection
  // 2. Has existing photo, none picked yet → show current photo with change option
  // 3. No photo at all → upload zone
  const showNewPreview     = !!selected;
  const showCurrentPhoto   = !selected && hasBaseImage && baseImageUrl;
  const showUploadZone     = !selected && !hasBaseImage;

  return (
    <>
      <div className={`overlay${showBaseModal ? ' show' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) close(); }}>
        <div className="sheet">
          <div className="sheet-grip" />
          <div className="sheet-title">Your Photo</div>
          <div className="sheet-sub">
            Upload a clear full-body or half-body photo of yourself for the best try-on results.
          </div>

          {/* ── New photo selected ── */}
          {showNewPreview && (
            <div className="base-preview show">
              <img className="base-preview-img" src={selected.base64} alt="" />
              <div className="base-preview-name">{selected.file.name}</div>
              <button className="base-reselect" onClick={() => fileInputRef.current?.click()}>
                Choose different photo
              </button>
            </div>
          )}

          {/* ── Existing photo — show it prominently ── */}
          {showCurrentPhoto && (
            <div className="base-current-wrap">
              <div className="base-current-img-wrap">
                <img
                  src={baseImageUrl}
                  alt="Your current photo"
                  className="base-current-img"
                  draggable={false}
                  onContextMenu={e => e.preventDefault()}
                />
                <div className="base-current-badge">Current Photo</div>
              </div>
              <button className="base-change-btn" onClick={() => fileInputRef.current?.click()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload a new photo
              </button>
            </div>
          )}

          {/* ── No photo yet — upload zone ── */}
          {showUploadZone && (
            <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
              <div className="upload-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div className="upload-txt">Tap to upload photo</div>
              <div className="upload-hint">JPG, PNG • up to 10 MB</div>
            </div>
          )}

          {/* Primary action */}
          <button className="btn-primary"
            disabled={!selected || uploading}
            onClick={submit}
            style={{ marginTop: 18 }}>
            {uploading ? 'Uploading…' : 'Use This Photo ✓'}
          </button>

          {showCancel && (
            <button onClick={close} style={{
              marginTop: 12, width: '100%', padding: '12px',
              fontWeight: 700, fontSize: 15, color: 'var(--ink-2)',
              textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer',
            }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*"
        style={{ display: 'none' }} onChange={onFileSelected} />
    </>
  );
}
