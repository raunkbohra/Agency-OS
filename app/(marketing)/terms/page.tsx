import { PageHero } from '@/components/landing/page-hero';
import { ContentSection } from '@/components/landing/content-section';

export default function TermsPage() {
  return (
    <>
      <PageHero badge="Legal" title="Terms of Service" lastUpdated="March 3, 2026" />
      <ContentSection narrow>
        <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Agency OS at agencyos.dev ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. We reserve the right to modify these Terms at any time, and your continued use of the Service constitutes acceptance of those modifications.
          </p>
          <p>
            Agency OS is provided by Agency OS, Inc. ("Company," "we," "us," or "our"). These Terms apply to all users of the Service, including website visitors and paid customers.
          </p>

          <h2>2. Account Registration and Use</h2>
          <p>
            To use Agency OS, you must create an account by providing accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and password. You agree not to share your login information with unauthorized parties and to notify us immediately if you discover unauthorized access to your account.
          </p>
          <p>
            You agree to use the Service only for lawful purposes and in compliance with these Terms. You may not use the Service to engage in any activity that violates laws, infringes intellectual property rights, or violates others' rights to privacy or publicity.
          </p>
          <p>
            Each account is intended for a single organization or team. You agree not to create multiple accounts to circumvent payment terms or usage limits. We reserve the right to suspend accounts that violate this provision.
          </p>

          <h2>3. Subscription, Payment, and Billing</h2>
          <h3>Payment Terms</h3>
          <p>
            Agency OS offers subscription plans on a monthly or annual basis. Fees are based on your selected plan and are due in advance for each billing period. We accept major credit cards and other payment methods as displayed on our billing page. By providing payment information, you authorize us to charge your account for the applicable subscription fees.
          </p>

          <h3>Billing and Invoices</h3>
          <p>
            We will bill you on the renewal date of your subscription unless you cancel before the next billing cycle. You will receive an invoice for each billing period, which you can download from your account dashboard. Invoices are issued in USD or your local currency as selected during signup.
          </p>

          <h3>Pricing Changes</h3>
          <p>
            We reserve the right to modify pricing for our plans. Price changes will not apply to existing billing cycles but will take effect on your next renewal date. We will notify you of price changes at least 30 days before they take effect. If you do not accept the new pricing, you may cancel your subscription before the change takes effect.
          </p>

          <h3>Failed Payments</h3>
          <p>
            If a payment fails, we will attempt to retry it using your saved payment method. If payment continues to fail after multiple attempts, we may suspend your account until payment is resolved. You are responsible for all charges incurred, including late fees or collection costs, where permitted by law.
          </p>

          <h2>4. Cancellation and Refunds</h2>
          <h3>Cancellation</h3>
          <p>
            You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of your current billing period, and you will retain access to the Service until that date. After cancellation, your account data will be retained for 30 days before permanent deletion, allowing for account recovery if needed.
          </p>

          <h3>Refund Policy</h3>
          <p>
            We do not offer refunds for partially used subscription periods. However, if you believe there has been a billing error or if you cancel within 7 days of purchase, we may provide a refund at our discretion. To request a refund, contact support@agencyos.dev within 14 days of the charge.
          </p>

          <h3>Trial Periods</h3>
          <p>
            If Agency OS offers a free trial period, you must provide valid payment information to begin the trial. Your paid subscription will automatically begin at the end of the trial period unless you cancel before the trial expires. We will send reminder notifications prior to charging your account.
          </p>

          <h2>5. Acceptable Use Policy</h2>
          <p>
            You agree not to use Agency OS for any of the following purposes:
          </p>
          <ul>
            <li>Violating any laws, regulations, or third-party rights</li>
            <li>Harassment, abuse, or threatening behavior toward other users</li>
            <li>Uploading or transmitting malware, viruses, or harmful code</li>
            <li>Attempting to gain unauthorized access to the Service or other users' accounts</li>
            <li>Interfering with the operation or security of the Service</li>
            <li>Reverse engineering, decompiling, or attempting to derive the source code of the Service</li>
            <li>Scraping, crawling, or automated data collection without authorization</li>
            <li>Sending unsolicited marketing or spam messages</li>
            <li>Using the Service for benchmarking or competitive analysis</li>
            <li>Sharing account credentials or allowing unauthorized users to access your account</li>
          </ul>
          <p>
            We monitor for violations of this policy and reserve the right to suspend or terminate your account if you engage in prohibited activities. We also reserve the right to cooperate with law enforcement and provide user information as required by law.
          </p>

          <h2>6. Intellectual Property Rights</h2>
          <h3>Agency OS Intellectual Property</h3>
          <p>
            Agency OS, including all software, features, functionality, designs, graphics, text, and other content (collectively, "Platform Materials"), is owned by or licensed to Agency OS. You may not copy, modify, distribute, or create derivative works of Platform Materials without express written permission. Your use of the Service grants you a limited, non-exclusive, non-transferable license to access and use the Service for your business purposes only.
          </p>

          <h3>Your Content</h3>
          <p>
            You retain all intellectual property rights to content you create and upload to Agency OS, including project plans, deliverable specifications, contract templates, and client communications. By uploading content to the Service, you grant Agency OS a worldwide, royalty-free license to use, store, transmit, and display your content solely for the purpose of providing the Service to you and enabling collaboration features (such as client portals and team sharing).
          </p>

          <h2>7. Client Data Ownership</h2>
          <p>
            You retain all rights to client data, project information, deliverables, invoices, and contracts managed through Agency OS. We serve as a data processor on your behalf. You acknowledge that your clients may have certain rights to their own data (such as names, feedback, and deliverable specifications provided through client portals) and you are responsible for ensuring appropriate contractual terms with your clients regarding data use and retention.
          </p>
          <p>
            Upon account deletion or contract termination, you have 30 days to export your data. After 30 days, we may permanently delete your account data. We are not responsible for any loss of data after this retention period.
          </p>

          <h2>8. Service Availability and Support</h2>
          <h3>Service Level</h3>
          <p>
            We aim to maintain the Service with 99% uptime, excluding scheduled maintenance and unforeseen outages beyond our reasonable control. We do not guarantee uninterrupted availability, and we are not liable for downtime due to server failures, internet connectivity issues, or natural disasters.
          </p>

          <h3>Scheduled Maintenance</h3>
          <p>
            We may conduct scheduled maintenance at any time with reasonable notice when possible. We will endeavor to schedule maintenance during off-peak hours to minimize disruption.
          </p>

          <h3>Support</h3>
          <p>
            Customer support is available via email at support@agencyos.dev. Support response times are best-effort and may vary based on inquiry complexity and support volume.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Agency OS and its officers, directors, employees, and agents will not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, loss of data, lost business opportunity, or reputational harm, even if advised of the possibility of such damages.
          </p>
          <p>
            Our total liability for any claims arising from or relating to these Terms or your use of the Service shall not exceed the total amount you paid to Agency OS in the 12 months preceding the claim. If you have not paid any fees, our liability is limited to $100.
          </p>
          <p>
            Some jurisdictions do not allow the limitation of liability, so this limitation may not apply to you. In such cases, our liability is limited to the greatest extent permitted by law.
          </p>

          <h2>10. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless Agency OS and its officers, directors, employees, and agents from any claims, damages, liabilities, and expenses (including attorney's fees) arising from or related to:
          </p>
          <ul>
            <li>Your use of the Service or violation of these Terms</li>
            <li>Your content, including any copyright or privacy infringement claims</li>
            <li>Your violation of any applicable laws or third-party rights</li>
            <li>Disputes with your clients or other users regarding data or contracts</li>
          </ul>

          <h2>11. Dispute Resolution</h2>
          <h3>Governing Law</h3>
          <p>
            These Terms are governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law principles.
          </p>

          <h3>Informal Resolution</h3>
          <p>
            Before initiating any formal legal proceeding, you agree to contact us at support@agencyos.dev and attempt to resolve the dispute informally. We will work with you in good faith to resolve any disagreements.
          </p>

          <h3>Binding Arbitration</h3>
          <p>
            Any dispute arising from or relating to these Terms or your use of the Service will be resolved by binding arbitration administered by the American Arbitration Association (AAA). Arbitration will be conducted on an individual basis (not as a class action), and you waive your right to a jury trial and class action remedies. The arbitrator will apply the substantive law of Delaware and may award any relief that would be available in court. Arbitration costs will be shared equally unless otherwise determined by the arbitrator.
          </p>

          <h2>12. Modifications to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Significant changes will be communicated to you via email or by posting an updated version on our website. Your continued use of the Service after modifications constitutes your acceptance of the modified Terms. If you do not agree with modifications, you may cancel your subscription.
          </p>

          <h2>13. Severability</h2>
          <p>
            If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions will remain in full force and effect. If a provision is found unenforceable, we will modify it to the minimum extent necessary to make it enforceable while preserving the intent.
          </p>

          <h2>14. Entire Agreement</h2>
          <p>
            These Terms, along with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and Agency OS regarding the Service. These Terms supersede all prior agreements and understandings. If you have a written agreement with Agency OS, that agreement will control to the extent it conflicts with these Terms.
          </p>

          <h2>15. Contact Us</h2>
          <p>
            For questions about these Terms of Service or to report violations, please contact us at:
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
