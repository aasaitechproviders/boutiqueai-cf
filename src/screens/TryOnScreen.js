import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import Stepper from '../components/Stepper';

export default function TryOnScreen({ onGenerate, isGenerating }) {
  const {
    hasBaseImage, baseImageUrl,
    setShowBaseModal, setBaseModalContext,
    showToast, setCurrentScreen,
  } = useApp();

  // Local product files — NOT stored in context, passed directly to onGenerate
  const [productFiles, setProductFiles] = useState([]);
  const productInputRef = useRef(null);

  function addProductFile(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || productFiles.length >= 3) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setProductFiles(prev => [...prev, { file, base64: ev.target.result }]);
    };
    reader.readAsDataURL(file);
  }

  function removeProduct(i) {
    setProductFiles(prev => prev.filter((_, idx) => idx !== i));
  }

  const steps = [
    { label: 'Your Photo',     state: hasBaseImage ? 'done' : 'active' },
    { label: 'Product Photos', state: hasBaseImage && productFiles.length > 0 ? 'done' : (hasBaseImage ? 'active' : '') },
    { label: 'Generate',       state: hasBaseImage && productFiles.length > 0 ? 'active' : '' },
  ];

  const canGenerate = hasBaseImage && productFiles.length > 0 && !isGenerating;

  function handleGenerate() {
    if (!canGenerate) return;
    // Pass files directly — App.js doesn't rely on context productFiles for mobile
    onGenerate(productFiles);
  }

  return (
    <section className="screen active" id="screen-tryon">
      <header className="app-header">
        <button className="hdr-btn" onClick={() => setCurrentScreen('home')} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="hdr-title">New Try-On</div>
        <button className="hdr-btn"
          onClick={() => showToast('Add your photo, then product photos to generate your look')}
          aria-label="Help">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12" y2="17"/>
          </svg>
        </button>
      </header>

      <Stepper steps={steps} />

      <div className="screen-scroll">
        <div className="tryon-pad">

          {/* Your Photo */}
          <div className="panel">
            <div className="panel-title">Your Photo</div>
            <div className="yourphoto">
              <div className="yp-thumb">
                {hasBaseImage && baseImageUrl
                  ? <img src={baseImageUrl} alt="" />
                  : <span>🤳</span>
                }
              </div>
              <div>
                <div className={`yp-status${hasBaseImage ? ' ok' : ''}`}>
                  {hasBaseImage ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Photo uploaded
                    </>
                  ) : (
                    <span>No photo yet</span>
                  )}
                </div>
                <button className="yp-change"
                  onClick={() => { setBaseModalContext('init'); setShowBaseModal(true); }}>
                  <span>{hasBaseImage ? 'Change photo' : 'Add photo'}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Product Photos */}
          <div className="panel">
            <div className="panel-title">
              Product Photos <span className="hint">Add up to 3</span>
            </div>
            <div className="prod-grid">
              {productFiles.map((p, i) => (
                <div key={i} className="prod-slot filled">
                  <img src={p.base64} alt="" />
                  <button className="prod-remove" onClick={() => removeProduct(i)} aria-label="Remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
              {Array.from({ length: Math.max(3 - productFiles.length, 0) }).map((_, i) => (
                <div key={`add-${i}`} className="prod-slot add"
                  onClick={() => productInputRef.current?.click()}>
                  <div className="prod-cam">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                  <div className="prod-add-lbl">Add photo</div>
                </div>
              ))}
            </div>
          </div>

          {/* Spacer so content clears the fixed generate button */}
          <div style={{ height: 100 }} />
        </div>
      </div>

      {/* Fixed Generate button above bottom nav */}
      <div className="tryon-foot">
        <button className="gen-btn" disabled={!canGenerate} onClick={handleGenerate}>
          <svg className="spark" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/>
          </svg>
          {isGenerating ? 'Generating…' : 'Generate Look'}
        </button>
      </div>

      <input ref={productInputRef} type="file" accept="image/*"
        style={{ display: 'none' }} onChange={addProductFile} />
    </section>
  );
}
