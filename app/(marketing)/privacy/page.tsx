import { PageHero } from '@/components/landing/page-hero';
import { ContentSection } from '@/components/landing/content-section';

export default function PrivacyPage() {
  return (
    <>
      <PageHero badge="Legal" title="Privacy Policy" lastUpdated="March 3, 2026" />
      <ContentSection narrow>
        <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
          <h2>Introduction</h2>
          <p>
            At Agency OS, we are committed to protecting your privacy and ensuring transparency about how we collect, use, and protect your personal data. This Privacy Policy explains our practices regarding personal information collected from users of our platform at agencyos.dev ("Service"), including website visitors and customers who use our project management, client management, deliverable tracking, invoicing, and contract management tools.
          </p>
          <p>
            We comply with applicable data protection regulations including GDPR, CCPA, and other privacy laws. If you have questions about this policy, please contact us at support@agencyos.dev.
          </p>

          <h2>Data We Collect</h2>

          <h3>Account Information</h3>
          <p>
            When you create an Agency OS account, we collect information necessary to set up and maintain your account, including your name, email address, password, company name, phone number, and billing address. We also collect optional profile information such as your company logo, website, and company description to personalize your dashboard and client portal experience.
          </p>

          <h3>Project and Deliverable Data</h3>
          <p>
            As you use Agency OS to create projects, manage deliverables, and track project milestones, we collect and store the content you create. This includes project titles, descriptions, deliverable specifications, timelines, status updates, project budgets, and any files you upload to your projects. This data is stored on our servers to provide you with persistent project management capabilities and to enable collaboration features.
          </p>

          <h3>Client and Contact Information</h3>
          <p>
            When you add clients to your Agency OS account, we collect and store client names, email addresses, phone numbers, company information, billing details, and any communication history within the platform. This information is used to facilitate client management, generate client portals, send invoices, and manage contract relationships.
          </p>

          <h3>Invoice and Financial Data</h3>
          <p>
            To process payments and invoicing, we collect information about your transactions including invoice amounts, billing dates, payment method types, and banking information (bank name, account type, and routing details). Bank account numbers are not stored; we only maintain anonymized banking information for display purposes. Payment processing is handled by secure third-party processors, and we do not directly store complete credit card information.
          </p>

          <h3>Usage Data and Analytics</h3>
          <p>
            We automatically collect information about how you interact with the Service, including the features you use, pages you visit, time spent in different sections, and actions you take (e.g., creating projects, updating deliverables, sending invoices). We use analytics tools to track error logs, performance metrics, device information, browser type, IP address, and referring URL. This data helps us improve our Service, detect technical issues, and understand user behavior patterns.
          </p>

          <h3>Communication Data</h3>
          <p>
            If you contact our support team, we collect records of your communication including emails, support tickets, chat conversations, and attachments. We retain these records to provide customer support, resolve issues, and improve our services.
          </p>

          <h2>How We Use Your Data</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li>To provide, maintain, and improve the Agency OS Service</li>
            <li>To authenticate users and maintain account security</li>
            <li>To process payments, invoices, and billing transactions</li>
            <li>To enable client portal access and project collaboration features</li>
            <li>To send transactional communications (account confirmations, password resets, billing notices)</li>
            <li>To provide customer support and respond to inquiries</li>
            <li>To monitor platform health, prevent fraud, and detect unauthorized access</li>
            <li>To conduct data analytics and improve user experience</li>
            <li>To comply with legal obligations and enforce our Terms of Service</li>
            <li>To send marketing communications (with your opt-in consent)</li>
          </ul>

          <h2>Sharing Your Data</h2>
          <p>
            We do not sell your personal data to third parties. However, we may share information in the following circumstances:
          </p>
          <ul>
            <li><strong>Service Providers:</strong> We share data with trusted vendors who help us operate the Service, including payment processors, email providers, cloud infrastructure providers, and analytics services. These providers are bound by confidentiality agreements.</li>
            <li><strong>Client Portals:</strong> When you create client portals, we share necessary project and deliverable information with your clients to enable collaboration and feedback. Only data you explicitly share is visible to clients.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government request, or when necessary to protect our legal rights.</li>
            <li><strong>Business Transfers:</strong> If Agency OS is acquired or merged with another company, your data may be transferred as part of that transaction. We will notify you of any such change.</li>
            <li><strong>Aggregate Data:</strong> We may share anonymized, aggregated data for analytics and benchmarking purposes.</li>
          </ul>

          <h2>Cookies and Tracking Technologies</h2>
          <p>
            Agency OS uses cookies and similar tracking technologies to maintain your session, remember preferences, and understand how you use our platform. Please refer to our Cookie Policy for detailed information about the cookies we use, how to manage them, and your choices regarding consent.
          </p>

          <h2>Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data against unauthorized access, alteration, disclosure, or destruction. Our security practices include encryption in transit (HTTPS/TLS), encrypted data storage, secure authentication mechanisms, regular security audits, and access controls. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
          </p>
          <p>
            We recommend using strong passwords, enabling two-factor authentication on your account, and keeping your login credentials confidential. If you believe your account has been compromised, please contact us immediately at support@agencyos.dev.
          </p>

          <h2>Your Data Rights</h2>
          <p>
            Depending on your location and applicable privacy laws, you may have the following rights regarding your personal data:
          </p>
          <ul>
            <li><strong>Right to Access:</strong> You can request a copy of the personal data we hold about you.</li>
            <li><strong>Right to Correction:</strong> You can request that we correct inaccurate or incomplete data.</li>
            <li><strong>Right to Deletion:</strong> You can request deletion of your personal data, subject to legal retention requirements.</li>
            <li><strong>Right to Data Portability:</strong> You can request your data in a structured, portable format to transfer to another service.</li>
            <li><strong>Right to Withdraw Consent:</strong> If processing is based on your consent, you can withdraw that consent at any time.</li>
            <li><strong>Right to Restrict Processing:</strong> You can request that we limit how we use your data.</li>
            <li><strong>Right to Object:</strong> You can object to certain types of processing, including marketing communications.</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at support@agencyos.dev. We will respond to verified requests within the timeframe required by applicable law.
          </p>

          <h2>Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as necessary to provide the Service. After account deletion, we retain certain data in anonymized form for analytics and legal compliance purposes. Specific retention periods vary by data type and legal requirement. We do not retain complete payment card information; payment data is managed by our payment processors. Project data, client information, and invoices are retained for as long as needed for business records and tax compliance.
          </p>

          <h2>Children's Privacy</h2>
          <p>
            Agency OS is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete such information and terminate the child's account.
          </p>

          <h2>Third-Party Links</h2>
          <p>
            Our Service may contain links to third-party websites and applications. This Privacy Policy does not apply to third-party services, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party services before providing your information.
          </p>

          <h2>International Data Transfers</h2>
          <p>
            Agency OS operates servers in the United States. If you are located outside the United States, your personal data will be transferred to, stored in, and processed in the United States. By using Agency OS, you consent to this transfer. We implement standard contractual clauses and other safeguards to ensure adequate protection of data transferred internationally.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of significant changes by posting the updated policy on our website and updating the "Last Updated" date. Your continued use of the Service after changes constitutes your acceptance of the updated policy.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, wish to exercise your data rights, or have concerns about our privacy practices, please contact us at:
          </p>
          <p>
            <strong>Agency OS Support</strong>
            <br />
            Email: support@agencyos.dev
          </p>
        </div>
      </ContentSection>
    </>
  );
}
