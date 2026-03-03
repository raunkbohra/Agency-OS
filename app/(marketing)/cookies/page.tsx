import { PageHero } from '@/components/landing/page-hero';
import { ContentSection } from '@/components/landing/content-section';

export default function CookiesPage() {
  return (
    <>
      <PageHero badge="Legal" title="Cookie Policy" lastUpdated="March 3, 2026" />
      <ContentSection narrow>
        <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
          <h2>What Are Cookies?</h2>
          <p>
            Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. Cookies serve several functions: they help websites remember your preferences, maintain your session, track your activity, and improve your browsing experience. Cookies are harmless and cannot execute code or transmit viruses; they simply store information about your interaction with the website.
          </p>
          <p>
            This Cookie Policy explains how Agency OS at agencyos.dev uses cookies and similar tracking technologies, what types of cookies we use, how to manage them, and your choices regarding cookie consent.
          </p>

          <h2>Types of Cookies We Use</h2>

          <h3>Essential Cookies (Strictly Necessary)</h3>
          <p>
            Essential cookies are required for the basic functionality of Agency OS. Without these cookies, the website and application would not function properly. These cookies include:
          </p>
          <ul>
            <li><strong>Session Cookies:</strong> These cookies maintain your authentication and login session. They allow us to recognize you as a logged-in user and prevent you from needing to re-authenticate on each page load.</li>
            <li><strong>Security Cookies:</strong> We use cookies to detect and prevent fraudulent access attempts and security threats to your account.</li>
            <li><strong>Preference Cookies:</strong> These cookies remember your choices, such as dark mode preference, language selection, and sidebar collapse state.</li>
            <li><strong>CSRF Protection:</strong> Cross-Site Request Forgery (CSRF) tokens are stored as cookies to prevent unauthorized actions on your account.</li>
          </ul>
          <p>
            These cookies are essential and cannot be disabled without significantly impairing the functionality of the Service. They do not require consent because they are necessary for the Service to operate.
          </p>

          <h3>Analytics Cookies</h3>
          <p>
            We use analytics cookies to understand how users interact with Agency OS. These cookies collect information about the features you use, pages you visit, time spent in different areas, and actions you perform (e.g., creating projects, updating deliverables, sending invoices). This data helps us:
          </p>
          <ul>
            <li>Identify which features are most valuable to users</li>
            <li>Detect technical issues and performance problems</li>
            <li>Understand user behavior patterns and usage trends</li>
            <li>Improve the user interface and user experience</li>
            <li>Make data-driven decisions about feature development</li>
          </ul>
          <p>
            We use Google Analytics to collect and analyze this information. Analytics cookies are non-essential and may be disabled if you prefer. See the "Managing Cookies" section below for instructions on how to opt out.
          </p>

          <h3>Preference and Functionality Cookies</h3>
          <p>
            These cookies remember your preferences and choices to provide a more personalized experience:
          </p>
          <ul>
            <li><strong>Theme Preference:</strong> Whether you use light or dark mode</li>
            <li><strong>Language Setting:</strong> Your selected language</li>
            <li><strong>Timezone:</strong> Your timezone for date and time displays</li>
            <li><strong>Dashboard Layout:</strong> Your customized dashboard and sidebar preferences</li>
            <li><strong>Notification Settings:</strong> Your communication preferences</li>
          </ul>
          <p>
            These cookies enhance your experience by maintaining your customizations across sessions. While not strictly essential, disabling them will reset your preferences on each visit.
          </p>

          <h3>Third-Party Cookies</h3>
          <p>
            Third-party cookies are set by domains other than agencyos.dev. We use the following third-party services that may set cookies:
          </p>
          <ul>
            <li><strong>Google Analytics:</strong> Analyzes user behavior and traffic patterns. Cookies are used to track page views, user sessions, and interaction events.</li>
            <li><strong>Payment Processors:</strong> Our payment partners (e.g., Stripe) may set cookies to process transactions securely and prevent fraud.</li>
            <li><strong>Email Service Providers:</strong> Our email providers may use cookies to track email opens and clicks in transactional communications (e.g., password reset emails).</li>
            <li><strong>CDN and Hosting Providers:</strong> Cookies may be set by our content delivery network and hosting infrastructure for performance and security purposes.</li>
          </ul>
          <p>
            We are not responsible for the privacy practices of third-party services. We encourage you to review the privacy policies of these providers directly.
          </p>

          <h2>Other Tracking Technologies</h2>
          <p>
            Beyond cookies, we use other tracking technologies to monitor and improve the Service:
          </p>
          <ul>
            <li><strong>Pixels and Web Beacons:</strong> Small transparent images embedded in pages that track whether content was viewed or interacted with.</li>
            <li><strong>Local Storage:</strong> Browser local storage and session storage are used to store user preferences and session data without sending information to our servers with every request.</li>
            <li><strong>Log Files:</strong> We collect server logs that include IP addresses, browser type, referring pages, and requested resources to monitor service health and detect issues.</li>
          </ul>

          <h2>How We Use Cookie Data</h2>
          <p>
            The information collected through cookies and tracking technologies is used for the following purposes:
          </p>
          <ul>
            <li>To maintain your authenticated session and provide personalized account access</li>
            <li>To remember your preferences and customize your experience</li>
            <li>To analyze usage patterns and understand how features are used</li>
            <li>To monitor system performance and detect errors</li>
            <li>To prevent security threats and unauthorized access</li>
            <li>To improve user interface design and feature functionality</li>
            <li>To generate aggregated, anonymized analytics reports</li>
            <li>To comply with legal obligations</li>
          </ul>

          <h2>Managing Cookies</h2>

          <h3>Browser Controls</h3>
          <p>
            Most web browsers allow you to control cookies through their settings. You can:
          </p>
          <ul>
            <li><strong>Block all cookies:</strong> Configure your browser to reject all cookies</li>
            <li><strong>Block third-party cookies:</strong> Allow first-party cookies but block third-party cookies</li>
            <li><strong>Delete existing cookies:</strong> Clear cookies stored on your device</li>
            <li><strong>Receive notifications:</strong> Get alerts when websites try to set cookies</li>
          </ul>
          <p>
            Instructions for managing cookies vary by browser. Common browsers include:
          </p>
          <ul>
            <li><strong>Chrome:</strong> Settings {`>`} Privacy and Security {`>`} Cookies and other site data</li>
            <li><strong>Firefox:</strong> Preferences {`>`} Privacy & Security {`>`} Cookies and Site Data</li>
            <li><strong>Safari:</strong> Preferences {`>`} Privacy {`>`} Cookies and website data</li>
            <li><strong>Edge:</strong> Settings {`>`} Privacy, search, and services {`>`} Cookies and other site permissions</li>
          </ul>

          <h3>Opt-Out of Analytics</h3>
          <p>
            If you prefer not to have your activity tracked for analytics purposes, you can install the Google Analytics Opt-out Browser Extension. This extension prevents Google Analytics from collecting your browsing data while you use Agency OS.
          </p>

          <h3>Do Not Track Signals</h3>
          <p>
            Some browsers include a "Do Not Track" feature that sends a signal indicating your privacy preference. Currently, Agency OS does not respond to Do Not Track signals, but we respect all explicit cookie consent choices you make through our browser settings or preference controls.
          </p>

          <h3>Account Settings</h3>
          <p>
            As a logged-in user, you can manage certain tracking preferences through your Agency OS account settings:
          </p>
          <ul>
            <li>Adjust email notification frequency</li>
            <li>Control data collection for usage analytics</li>
            <li>Manage your privacy and communication preferences</li>
          </ul>

          <h2>Cookie Consent</h2>
          <p>
            When you first visit Agency OS, we display a cookie consent banner explaining our use of cookies. This banner allows you to:
          </p>
          <ul>
            <li><strong>Accept All:</strong> Consent to all cookies and tracking technologies</li>
            <li><strong>Accept Essential Only:</strong> Accept only essential cookies required for basic functionality</li>
            <li><strong>Manage Preferences:</strong> Choose which categories of cookies you consent to</li>
          </ul>
          <p>
            Your consent choice is remembered for one year. You can change your preferences at any time by visiting your account settings or contacting support@agencyos.dev.
          </p>
          <p>
            Essential cookies are always enabled because they are necessary for the Service to function. All other cookies require your explicit consent.
          </p>

          <h2>International Considerations</h2>
          <p>
            Different jurisdictions have different regulations regarding cookies and tracking. If you are located in the European Union, your data is subject to GDPR, and we require explicit consent before setting non-essential cookies. If you are located in California, you have rights under CCPA regarding your personal information collected through cookies. Residents of other jurisdictions may have similar rights. Please refer to our Privacy Policy for more information about your rights.
          </p>

          <h2>Third-Party Websites and Links</h2>
          <p>
            Agency OS may contain links to third-party websites and applications. This Cookie Policy applies only to agencyos.dev and does not cover cookies set by external websites. We recommend reviewing the cookie policies of third-party sites before providing your information to them.
          </p>

          <h2>Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in our cookie practices or applicable regulations. Updates will be posted on our website with a revised "Last Updated" date. Significant changes will be communicated to you via email or through the platform. Your continued use of Agency OS after policy updates constitutes your acceptance of the updated policy.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have questions about our use of cookies, wish to exercise your privacy rights, or need assistance managing your cookie preferences, please contact us:
          </p>
          <p>
            <strong>Agency OS Support</strong>
            <br />
            Email: support@agencyos.dev
          </p>
          <p>
            You can also refer to our full Privacy Policy for additional information about how we collect, use, and protect your personal data.
          </p>
        </div>
      </ContentSection>
    </>
  );
}
