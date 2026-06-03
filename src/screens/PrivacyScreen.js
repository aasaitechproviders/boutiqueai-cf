import { useApp } from '../context/AppContext';

export default function PrivacyScreen() {
  const { setCurrentScreen } = useApp();

  return (
    <section className="screen screen-legal active">
      <div className="legal-header">
        <button className="legal-back" onClick={() => setCurrentScreen('home')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="legal-title">Privacy Policy</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="legal-body">
        <div className="legal-last-updated">Last updated: June 2026</div>

        <div className="legal-intro">
          At <strong>BoutiqueAI</strong> (operated by{' '}
          <strong>Aasai Tech Providers Private Limited</strong>, Devapandalam, Kallakurichi,
          Tamil Nadu, India — 606402), we take your privacy seriously. This policy explains what
          data we collect, why, and how it is protected — in compliance with India's{' '}
          <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> and the IT Act, 2000.
        </div>

        <LegalSection title="1. Data We Collect">
          <ul className="legal-list">
            <li><strong>Mobile number</strong> — used to identify you across sessions. Stored in our database and your device's local storage.</li>
            <li><strong>Your profile photo (base image)</strong> — uploaded by you to enable AI virtual try-on. Only one photo is stored at a time. Uploading a new photo immediately and permanently deletes the previous one.</li>
            <li><strong>AI-generated try-on images</strong> — images of you wearing boutique products. Automatically and permanently deleted after <strong>12 hours</strong> from generation.</li>
            <li><strong>Style profile</strong> — AI-inferred skin tone, recommended colours, and style preferences derived from your photo. Used only to personalise your experience.</li>
            <li><strong>Usage data</strong> — number of try-ons, timestamps, session IDs. Used for service operation and abuse prevention.</li>
          </ul>
          We do <strong>not</strong> collect your name, email, location, or payment information as an end user.
        </LegalSection>

        <LegalSection title="2. How We Use Your Data">
          <ul className="legal-list">
            <li>To generate virtual try-on images of you wearing boutique products.</li>
            <li>To personalise product and colour recommendations based on your style profile.</li>
            <li>To temporarily display your generated looks in your album for up to 12 hours.</li>
            <li>To prevent abuse and ensure fair use of the platform.</li>
          </ul>
          We do <strong>not</strong> sell, rent, or share your personal data with third parties for marketing purposes.
        </LegalSection>

        <LegalSection title="3. Third-Party AI Services">
          <strong>Your photo is shared with the following AI services to generate try-on results:</strong>
          <ul className="legal-list">
            <li><strong>Google Gemini</strong> (Google LLC, USA) — primary AI image generation engine. Google's privacy policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="legal-link">policies.google.com/privacy</a></li>
            <li><strong>Microsoft Azure OpenAI</strong> (Microsoft Corporation, USA) — AI chat and style analysis. Microsoft's privacy policy: <a href="https://privacy.microsoft.com" target="_blank" rel="noopener noreferrer" className="legal-link">privacy.microsoft.com</a></li>
          </ul>
          Images sent to these services are processed transiently for generation only and are not used to train AI models per their API data handling agreements.
        </LegalSection>

        <LegalSection title="4. Data Storage & Security">
          <ul className="legal-list">
            <li>Photos and generated images are stored on <strong>AWS S3</strong> in the Asia Pacific (Sydney) region with private-access controls.</li>
            <li>Account data is stored in <strong>MongoDB Atlas</strong> with encryption at rest and in transit.</li>
            <li>All data transmission uses HTTPS.</li>
            <li>Access is restricted to authorised systems only.</li>
          </ul>
        </LegalSection>

        <LegalSection title="5. Data Retention & Automatic Deletion">
          <ul className="legal-list">
            <li><strong>AI-generated try-on images</strong> — automatically and permanently deleted <strong>12 hours after generation</strong>. Please save images you wish to keep. We cannot recover deleted images.</li>
            <li><strong>Your profile photo</strong> — retained until you change or delete it. Only one photo is stored at a time — a new upload immediately and permanently replaces the previous one.</li>
            <li><strong>Notifications</strong> — auto-expire after 7 days.</li>
            <li><strong>Account deletion</strong> — all data including your profile photo and any remaining images are permanently deleted within 30 days of requesting account deletion.</li>
          </ul>
        </LegalSection>

        <LegalSection title="6. Your Rights (DPDP Act 2023)">
          Under India's Digital Personal Data Protection Act, you have the right to:
          <ul className="legal-list">
            <li><strong>Access</strong> — know what personal data we hold about you.</li>
            <li><strong>Correction</strong> — update or correct your data.</li>
            <li><strong>Erasure</strong> — request deletion of your data at any time.</li>
            <li><strong>Withdraw consent</strong> — stop using the service and request data deletion.</li>
            <li><strong>Grievance redressal</strong> — raise a complaint with us or the Data Protection Board of India.</li>
          </ul>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:support@aasaitech.in" className="legal-link">support@aasaitech.in</a>
        </LegalSection>

        <LegalSection title="7. Children's Privacy">
          This service is not directed at children under 13. We do not knowingly collect personal
          data from children under 13. If you believe a child has provided us with personal data,
          please contact us immediately and we will delete it.
        </LegalSection>

        <LegalSection title="8. Cookies & Local Storage">
          We use your browser's local storage (not cookies) to remember your mobile number and
          preferences across sessions. We do not use tracking cookies or advertising pixels.
        </LegalSection>

        <LegalSection title="9. Changes to This Policy">
          We may update this policy to reflect changes in our practices or legal requirements.
          We will notify you of significant changes via the app. Continued use constitutes acceptance.
        </LegalSection>

        <LegalSection title="10. Grievance Officer">
          As required by the IT Act, 2000 and DPDP Act, 2023, our Grievance Officer can be reached at:
          <div className="legal-contact-box">
            <div><strong>Aasai Tech Providers Private Limited</strong></div>
            <div>Devapandalam, Kallakurichi, Tamil Nadu, India — 606402</div>
            <div>Phone: <a href="tel:+918939134777" className="legal-link">+91 89391 34777</a></div>
            <div>Email: <a href="mailto:support@aasaitech.in" className="legal-link">support@aasaitech.in</a></div>
            <div>Website: <a href="https://aasaitech.in" target="_blank" rel="noopener noreferrer" className="legal-link">aasaitech.in</a></div>
            <div>Response time: within 30 days of receipt</div>
          </div>
        </LegalSection>

        <div className="legal-footer">
          © 2026 Aasai Tech Providers Private Limited, Kallakurichi, Tamil Nadu, India.
          All rights reserved.
        </div>
      </div>
    </section>
  );
}

function LegalSection({ title, children }) {
  return (
    <div className="legal-section">
      <div className="legal-section-title">{title}</div>
      <div className="legal-section-body">{children}</div>
    </div>
  );
}
