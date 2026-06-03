export default function Stepper({ steps }) {
  // steps: [{ label, state }] where state = 'done' | 'active' | ''
  return (
    <div className="stepper">
      {steps.map((step, i) => (
        <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div className={`step${step.state ? ' ' + step.state : ''}`}>
            <div className="step-dot">
              {step.state === 'done' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <div className="step-lbl">{step.label}</div>
          </div>
          {i < steps.length - 1 && (
            <div className={`step-line${step.state === 'done' ? ' done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}
