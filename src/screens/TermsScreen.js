import { useApp } from '../context/AppContext';

export default function TermsScreen() {
  const { setCurrentScreen } = useApp();

  return (
    <section className="screen screen-legal active">
      <div className="legal-header">
        <button className="legal-back" onClick={() => setCurrentScreen('home')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="legal-title">Terms of Service</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="legal-body">
        <div className="legal-last-updated">Last updated: June 2026</div>

        <div className="legal-intro">
          Welcome to <strong>BoutiqueAI</strong>, a virtual try-on platform operated by{' '}
          <strong>Aasai Tech Providers Private Limited</strong>, Devapandalam, Kallakurichi,
          Tamil Nadu, India — 606402. By using this service you agree to these terms in full.
        </div>

        <LegalSection title="1. Who We Are">
          BoutiqueAI is an AI-powered virtual try-on service that allows customers of boutique
          businesses to see how clothing and accessories look on them using artificial intelligence.
          The platform is operated by <strong>Aasai Tech Providers Private Limited</strong>,
          Devapandalam, Kallakurichi, Tamil Nadu, India — 606402.
          Website:{' '}
          <a href="https://aasaitech.in" target="_blank" rel="noopener noreferrer" className="legal-link">
            aasaitech.in
          </a>
        </LegalSection>

        <LegalSection title="2. Eligibility">
          You must be at least 13 years of age to use this service. By continuing, you confirm
          you meet this requirement. Users under 18 should have parental consent. We do not
          knowingly collect data from children under 13.
        </LegalSection>

        <LegalSection title="3. Your Account">
          You access BoutiqueAI using your mobile number. You are responsible for keeping your
          number accurate and for all activity associated with your account. We may suspend or
          terminate access at any time if these terms are violated.
        </LegalSection>

        <LegalSection title="4. Photo & AI Processing Consent">
          <strong>This is important.</strong> To use virtual try-on, you upload a photo of yourself.
          By uploading your photo you explicitly consent to:
          <ul className="legal-list">
            <li>Your photo being transmitted to and processed by third-party AI services (Google Gemini, Microsoft Azure) to generate virtual try-on images.</li>
            <li>Your photo being stored securely on AWS S3 servers in the Asia Pacific (Sydney) region.</li>
            <li>AI-generated images of you wearing boutique products being saved to your album.</li>
          </ul>
          You may delete your photo and all generated images at any time from your Profile.
          Deletion is permanent and processed immediately.
        </LegalSection>

        <LegalSection title="5. Data Retention & Automatic Deletion">
          We retain your data as follows:
          <ul className="legal-list">
            <li><strong>AI-generated try-on images</strong> — automatically and permanently deleted after <strong>12 hours</strong> from the time of generation. Please save any images you wish to keep before this window closes. We cannot recover deleted images.</li>
            <li><strong>Your profile photo (base image)</strong> — retained for as long as you use the service, or until you change or delete it. Only one photo is kept at a time — uploading a new photo immediately and permanently replaces the previous one.</li>
            <li><strong>Notifications</strong> — auto-expire after 7 days.</li>
            <li><strong>Account data</strong> — retained until you request deletion. All data is permanently deleted within 30 days of an account deletion request.</li>
          </ul>
        </LegalSection>

        <LegalSection title="6. Acceptable Use">
          You agree not to:
          <ul className="legal-list">
            <li>Upload photos of other people without their explicit consent.</li>
            <li>Use the service for any unlawful, harmful, or fraudulent purpose.</li>
            <li>Attempt to reverse-engineer, scrape, or abuse the platform.</li>
            <li>Upload content that is obscene, defamatory, or violates any third-party rights.</li>
          </ul>
        </LegalSection>

        <LegalSection title="7. Intellectual Property">
          All platform content, design, code, and branding are owned by Aasai Tech Providers
          Private Limited. AI-generated try-on images are provided for your personal use only.
          You may not use them commercially without written permission. We do not claim ownership
          of your uploaded photos.
        </LegalSection>

        <LegalSection title="8. AI Accuracy Disclaimer">
          Virtual try-on images are generated by artificial intelligence and are for illustrative
          purposes only. Actual product fit, colour, and appearance may differ. We make no
          guarantees about the accuracy of AI-generated results.
        </LegalSection>

        <LegalSection title="9. Payments & Credits">
          Boutique owners purchase plans and credits to offer try-on services to their customers.
          All payments are processed via Razorpay. Refund requests are handled per our Refund
          Policy available on the BoutiqueAI operator dashboard. End users (boutique customers)
          do not make payments directly to BoutiqueAI.
        </LegalSection>

        <LegalSection title="10. Limitation of Liability">
          To the maximum extent permitted by Indian law, Aasai Tech Providers Private Limited
          shall not be liable for any indirect, incidental, or consequential damages arising from
          your use of the service, including loss of generated images after the 12-hour deletion
          window. Our total liability shall not exceed ₹1,000.
        </LegalSection>

        <LegalSection title="11. Governing Law">
          These terms are governed by the laws of India. Any disputes shall be subject to the
          exclusive jurisdiction of courts in Kallakurichi, Tamil Nadu.
        </LegalSection>

        <LegalSection title="12. Changes to Terms">
          We may update these terms from time to time. Continued use of the service after changes
          constitutes acceptance of the new terms. Material changes will be notified in the app.
        </LegalSection>

        <LegalSection title="13. Contact Us">
          <div className="legal-contact-box">
            <div><strong>Aasai Tech Providers Private Limited</strong></div>
            <div>Devapandalam, Kallakurichi, Tamil Nadu, India — 606402</div>
            <div>Phone: <a href="tel:+918939134777" className="legal-link">+91 89391 34777</a></div>
            <div>Email: <a href="mailto:support@aasaitech.in" className="legal-link">support@aasaitech.in</a></div>
            <div>Website: <a href="https://aasaitech.in" target="_blank" rel="noopener noreferrer" className="legal-link">aasaitech.in</a></div>
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
